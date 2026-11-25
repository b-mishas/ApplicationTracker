// Preview first; apply with the preview's revision. All writes use the shared lock and backup.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {dataRoot} from './config.mjs';
import {calendarDate as localDate} from './settings.mjs';
import {validStageDate} from './status-history.mjs';
import {readState,commit,writeJsonAtomic} from './store.mjs';

const months=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const iso=(year,month,day)=>`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
export function normalizePostedDate(raw,observedAt){
 if(validStageDate(raw))return raw;
 if(typeof raw!=='string')return '';
 const text=raw.trim();
 if(observedAt&&!Number.isFinite(Date.parse(observedAt)))observedAt=undefined;
 // A closing date, a range or an approximate month is not a publication date.
 if(/^(?:~|<=?|closes?\b)/i.test(text))return '';
 const relative=text.match(/^(?:reposted\s+|posted\s+)?(\d+)\s+(day|week|hour)s?\s+ago(?:\s+\(page of \d{4}-\d{2}-\d{2}\))?$/i)||text.match(/^vor\s+(\d+)\s+(Tag|Woche|Stunde)(?:en|e|n)?(?:\s+\(page of \d{4}-\d{2}-\d{2}\))?$/i);
 if(relative){
  const annotation=text.match(/\b(\d{4}-\d{2}-\d{2})\b/)?.[1];
  const unit=relative[2].toLowerCase(),hours=['hour','stunde'].includes(unit);
  // A dated annotation establishes a calendar day, but not an observation hour.
  const anchor=annotation??(observedAt?localDate(new Date(observedAt)):undefined);
  if(!validStageDate(anchor,{allowEmpty:false}))return '';
  if(hours){
   if(annotation||!observedAt||!Number.isFinite(Date.parse(observedAt)-Number(relative[1])*3600000)||Math.abs(Date.parse(observedAt)-Number(relative[1])*3600000)>8.64e15)return '';
   return localDate(new Date(Date.parse(observedAt)-Number(relative[1])*3600000));
  }
  const days=Number(relative[1])*(unit==='week'||unit==='woche'?7:1);
  const date=new Date(anchor+'T00:00:00Z');date.setUTCDate(date.getUTCDate()-days);
  return Number.isFinite(date.getTime())?date.toISOString().slice(0,10):'';
 }
 let candidate=text.match(/^(?:(?:Published|PDF dated|Job offer dated)\s+)?(\d{4}-\d{2}-\d{2})(?:\s+\([^)]*\))?$/i)?.[1];
 const numeric=text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
 if(numeric)candidate=iso(numeric[3],numeric[2],numeric[1]);
 const english=text.match(/^(?:Posted\s+)?(?:(\d{1,2})\s+([A-Za-z]+)|([A-Za-z]+)\s+(\d{1,2}),?)\s+(\d{4})(?:\s+\([^)]*\))?$/);
 if(english){
  const month=months.indexOf((english[2]??english[3]).slice(0,3).toLowerCase())+1;
  if(month)candidate=iso(english[5],month,english[1]??english[4]);
 }
 return validStageDate(candidate,{allowEmpty:false})?candidate:'';
}

async function batchesUnder(root){
 const files=[];
 async function walk(dir){
  let entries;try{entries=await fs.readdir(dir,{withFileTypes:true});}catch(error){if(error.code==='ENOENT')return;throw error;}
  for(const entry of entries){const file=path.join(dir,entry.name);if(entry.isDirectory())await walk(file);else if(entry.name.endsWith('.json'))files.push(file);}
 }
 await walk(path.join(root,'incoming'));return files;
}
async function observationEvidence(root,data){
 const wanted=new Set(data.jobs.flatMap(job=>(job.sources??[]).map(source=>source.file))),batches=new Map();
 for(const file of await batchesUnder(root)){
  if(!wanted.has(path.basename(file)))continue;
  let batch;try{batch=JSON.parse(await fs.readFile(file,'utf8'));}catch{continue;}
  if(Array.isArray(batch.jobs))batches.set(path.basename(file),batch);
 }
 const evidence=new Map();
 for(const job of data.jobs){
  const matches=[];
  for(const source of job.sources??[]){
   for(const record of batches.get(source.file)?.jobs??[]){
    // Match the actual stored wording and vacancy, not simply the newest source date.
    if(record.postedDate!==job.postedDate||record.company!==job.company)continue;
    if(record.matchesRecordId!==job.id&&!(record.url===job.url&&record.title===job.title))continue;
    if(typeof record.observedAt==='string'&&/^\d{4}-\d{2}-\d{2}T.*Z$/.test(record.observedAt)&&Number.isFinite(Date.parse(record.observedAt)))matches.push({observedAt:record.observedAt,file:source.file});
   }
  }
  // Conflicting relative observations are ambiguous; do not pick one arbitrarily.
  const dates=new Set(matches.map(item=>normalizePostedDate(job.postedDate,item.observedAt)));
  if(matches.length&&dates.size===1)evidence.set(job.id,matches[0]);
 }
 return evidence;
}
export function planPostedDates(original,evidence=new Map()){
 const data=structuredClone(original),changes=[];
 for(const job of data.jobs){
  if(job.postedDate===undefined||validStageDate(job.postedDate))continue;
  const observation=evidence.get(job.id),after=normalizePostedDate(job.postedDate,observation?.observedAt);
  changes.push({id:job.id,before:job.postedDate,after,reason:after?'Converted source date or anchored relative age':'Unknown or ambiguous; cleared',evidence:observation??null});
  job.postedDate=after;
 }
 return {data,changes};
}
export async function migratePostedDates({root=dataRoot,apply=false,expectedRevision}={}){
 const before=await readState(root),evidence=await observationEvidence(root,before.data),plan=planPostedDates(before.data,evidence);
 const report={mode:apply?'apply':'preview',revision:before.revision,changed:plan.changes.length,converted:plan.changes.filter(c=>c.after).length,cleared:plan.changes.filter(c=>!c.after).length,changes:plan.changes};
 if(!apply)return report;
 if(!expectedRevision)throw Error('Apply requires --expected-revision from a fresh preview.');
 // Save original wording and decisions before mutating the database.
 const reportFile=path.join(root,'reports',`posted-date-migration-${Date.now()}.json`);
 await writeJsonAtomic(reportFile,report);
 const result=await commit(root,data=>{
  if(!plan.changes.length)return {skipWrite:true};
  data.jobs=plan.data.jobs;
 },{expectedRevision,tag:'before-posted-date-migration'});
 const final={...report,written:result.written,revision:result.revision,backup:result.backup,report:reportFile};
 await writeJsonAtomic(reportFile,final);return final;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),arg=key=>{const index=args.indexOf(key);return index<0?undefined:args[index+1];};
  for(let i=0;i<args.length;i++)if(['--root','--expected-revision'].includes(args[i])){if(!args[++i]||args[i].startsWith('--'))throw Error('Missing option value.');}else if(args[i]!=='--apply')throw Error('Unknown option: '+args[i]);
  console.log(JSON.stringify(await migratePostedDates({root:arg('--root')?path.resolve(arg('--root')):dataRoot,apply:args.includes('--apply'),expectedRevision:arg('--expected-revision')}),null,2));
 }catch(error){console.error(error.message);process.exitCode=1;}
}
