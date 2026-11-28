// Initial-search progress for setup, from records the routine already keeps: the employer workbook and coverage.json
// checkpoints, coverage `unfinished`, open finds, finish.json retry lists carried across interrupted runs
// (finish-run.mjs previousRetry) and run-completion.json identity. It never writes and never blocks a search.
import fs from 'node:fs/promises';
import path from 'node:path';
import {rowsOf,findOf,strongIds,open as openFinds} from './capture-check.mjs';
import {previousRetry} from './finish-run.mjs';
import {employerWorkbook} from './employer-workbook.mjs';

const parse=raw=>JSON.parse(raw.replace(/^﻿/,''));
const optional=async file=>{try{return parse(await fs.readFile(file,'utf8'));}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'') && Date.parse(value)<=Date.now();
const validFinish=(finish,runId)=>finish?.runId===runId && ['complete','partial'].includes(finish.searchCoverage) && Array.isArray(finish.retry);
// Run records, evidence, reading/mail progress, summaries and helper scripts are not results. Every other JSON or
// JSON-lines file is a result file whose finds must reach a ledger; any other non-empty file needs an attended review.
const RECORDS=/(^|\/)((run-ledger|source-evidence|evidence-.*|read-.*|mails-.*|refresh-.*|links-.*)\.jsonl|(run-completion|run-log|finish|due|due-selection|setup-recovery|storage-probe)\.json|summary\.md|[^/]*\.(m?js|cjs|py|ps1|sh))$/;
const some=(list,n=3)=>list.slice(0,n).join('; ')+(list.length>n?`; and ${list.length-n} more`:'');

async function filesIn(dir,prefix=''){
 const out=[];
 for(const entry of await fs.readdir(dir,{withFileTypes:true})){
  const rel=prefix+entry.name;
  if(entry.isDirectory())out.push(...await filesIn(path.join(dir,entry.name),rel+'/'));
  else if(entry.isFile())out.push(rel);
 }
 return out;
}
const empty=async(dir,files)=>(await Promise.all(files.map(f=>fs.readFile(path.join(dir,f),'utf8')))).every(text=>!text.trim());

// A taken-over run's saved finds must be in some run ledger. Result files without a recognizable find and other
// non-empty files stay unreviewed until the taking-over run lists them in `reviewed` ("<run ID>/<path>").
async function unresolved(dir,name,files,ledgerFinds,reviewed){
 const missing=[],unknown=[];
 for(const rel of files){
  if(RECORDS.test(rel) || reviewed.has(`${name}/${rel}`) || !(await fs.readFile(path.join(dir,rel),'utf8')).trim())continue;
  if(!/\.jsonl?$/.test(rel)){unknown.push(rel);continue;}
  let finds;try{finds=rowsOf(path.join(dir,rel)).map(findOf).filter(f=>f.company && f.title);}catch{finds=[];}
  if(!finds.length){unknown.push(rel);continue;}
  for(const find of finds){
   const ids=strongIds(find);
   const found=ledgerFinds.some(other=>other.company===find.company && (ids.length?strongIds(other).some(id=>ids.includes(id)):other.title===find.title && other.location===find.location));
   if(!found)missing.push(`${find.company} — ${find.title} (${rel})`);
  }
 }
 return {missing,unknown};
}

export async function setupSearchProgress(root,state,snapshot,reset){
 const blockers=[],data=path.join(root,'data'),runs=path.join(data,'reports/runs');
 if(reset.blocker)blockers.push(reset.blocker);
 const names=(await fs.readdir(runs,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;})).filter(e=>e.isDirectory()).map(e=>e.name).sort();
 let ledgerFinds=null,latest=null;const unfinished=[];
 for(const name of names){
  const dir=path.join(runs,name);
  try{
   const manifest=await optional(path.join(dir,'run-completion.json'));
   // Receipts from the earlier attended classifier stand for a takeover by their target run.
   const legacy=await optional(path.join(dir,'setup-recovery.json'));
   const takenOverBy=manifest?.takenOverBy||legacy?.targetRun||null;
   const files=(await filesIn(dir)).filter(f=>f!=='setup-recovery.json');
   if(!manifest && !takenOverBy){
    // A legacy empty classification holds only while the folder is still empty.
    if(!await empty(dir,files))blockers.push(`Run folder ${name} holds saved results but no run record${legacy?.kind==='empty'?', although it was once classified empty':''}. The next scheduled run takes them over; searching continues.`);
    continue;
   }
   if(takenOverBy){
    ledgerFinds??=names.flatMap(n=>{try{return rowsOf(path.join(runs,n,'run-ledger.jsonl')).map(findOf);}catch{return [];}});
    const taker=await optional(path.join(runs,takenOverBy,'run-completion.json')).catch(()=>null);
    const {missing,unknown}=await unresolved(dir,name,files,ledgerFinds,new Set(Array.isArray(taker?.reviewed)?taker.reviewed:[]));
    if(missing.length)blockers.push(`Run ${name} was taken over by ${takenOverBy}, but ${missing.length} saved find(s) are in no run ledger: ${some(missing)}. In an attended chat, ask the assistant to capture them in the next run; searching continues.`);
    if(unknown.length)blockers.push(`Run ${name} was taken over by ${takenOverBy}, but ${unknown.length} file(s) were not reviewed: ${some(unknown)}. In an attended chat, review them, capture any finds and list them in ${takenOverBy}'s run-completion.json \`reviewed\`; searching continues.`);
    continue;
   }
   if(manifest.status!=='finished')unfinished.push(name);
   if(manifest.setupId===state.setupId && !manifest.setupDiscovery){
    const at=Date.parse(manifest.startedAt);
    if(!Number.isFinite(at))blockers.push(`Run ${name} has no valid startedAt, so its order is unknown. Repair its run-completion.json from run-log.json; searching continues.`);
    else if(latest?.at===at)latest.tie=name;
    else if(!latest || at>latest.at)latest={name,at,manifest};
   }
  }catch(error){blockers.push(`Run ${name} cannot be read (${error.message}). Repair or restore the file named; searching continues.`);}
 }
 if(unfinished.length)blockers.push(`Run(s) ${some(unfinished)} did not finish. The next scheduled run continues today's run or takes earlier ones over; searching continues.`);
 if(!latest)return {status:blockers.length?'partial':'not_started',scope:snapshot.scope,latestRunId:null,carried:[],blockers};
 if(latest.tie)blockers.push(`Runs ${latest.name} and ${latest.tie} have the same start time, so the latest run is ambiguous. The next scheduled run resolves it.`);
 const finish=await optional(path.join(runs,latest.name,'finish.json')).catch(()=>null);
 if(latest.manifest.status==='finished' && !validFinish(finish,latest.name))blockers.push(`Run ${latest.name} is marked finished without a valid finish.json. The next run carries its due sources; searching continues.`);
 const completedAt=reset.receipt?.status==='complete'?Date.parse(reset.receipt.completedAt):-Infinity;
 if(latest.manifest.setupScope!==snapshot.scope || latest.at<completedAt)blockers.push(`The latest run ${latest.name} used an earlier configuration. The next scheduled run searches with the current one.`);
 const {retry:carried}=previousRetry(data);
 if(carried.length)blockers.push(`${carried.length} item(s) carry over to the next run: ${some(carried)}. The next run retries them; searching continues.`);
 const coverage=await optional(path.join(data,'reports/coverage.json'));
 if(!coverage)blockers.push('coverage.json is missing, so no checkpoint shows completed search. The next run creates it.');
 else{
  if(!Array.isArray(coverage.unfinished))blockers.push('coverage.json has no unfinished-work list. The next run rewrites it; searching continues.');
  else if(coverage.unfinished.length)blockers.push(`coverage.json lists ${coverage.unfinished.length} unfinished item(s). The next run continues them; searching continues.`);
  if(!coverage.gmailCheckedThrough)blockers.push('The Gmail alert interval has not been searched completely since setup or the last full replay. The next run continues it.');
  // Only portals already in coverage.json are checked here: configured portals live in profile prose (documented limit).
  const portals=Object.entries(coverage.sources||{}).filter(([,s])=>!s?.lastSuccessfulCheckedThrough).map(([name])=>name);
  if(portals.length)blockers.push(`Portal or gap search(es) without a successful check: ${some(portals)}. The next runs check them; if one keeps failing, review it in setup.`);
  const employers=(await employerWorkbook({file:path.join(root,'profile/companies.xlsx')})).employers
   .filter(e=>!validDate(e['Last checked']) && !validDate(coverage.employers?.[e.Company]?.lastChecked)).map(e=>e.Company);
  if(employers.length)blockers.push(`${employers.length} employer(s) without a successful check: ${some(employers)}. The next runs check them within the per-run limit.`);
 }
 const open=openFinds(data).slice(1).filter(line=>line.startsWith('open | '));
 if(open.length)blockers.push(`${open.length} find(s) still need a decision or import. The next run handles them; searching continues.`);
 return {status:blockers.length?'partial':'complete',scope:snapshot.scope,latestRunId:latest.name,carried,blockers};
}
