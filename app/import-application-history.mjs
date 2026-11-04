import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {runtime} from './export-applications.mjs';
import {dataRoot} from './config.mjs';
import {commit} from './store.mjs';
const normalize=s=>String(s??'').normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('de');
const identity=(co,city,title)=>[co,city,title].map(normalize).join('|');
export function historyStatus(text){
 if(/absage/i.test(text))return 'Rejected';
 if(/keine offenen stellen/i.test(text))return 'Dismissed';
 if(/zurückgezogen/i.test(text))return 'Withdrawn';
 if(/interview/i.test(text))return 'Interview';
 if(/angebot|zusage/i.test(text))return 'Offer';
 if(/warten auf rückmeldung/i.test(text))return 'Applied';
 throw Error(`Unknown application status: ${text}`);
}
export async function readApplicationHistory(file){
 const {FileBlob,SpreadsheetFile}=await runtime();
 const w=await SpreadsheetFile.importXlsx(await FileBlob.load(file)),s=w.worksheets.getItemAt(0);
 const values=s.getRange(`B1:F${Math.max(s.getUsedRange().values.length+3,30)}`).values;
 if(JSON.stringify(values[2])!==JSON.stringify(['Datum','Unternehmen','Ort','Stelle','Status']))throw Error('Unexpected history columns.');
 return values.slice(3).flatMap((v,i)=>{
  if(v.every(c=>c==null||c===''))return [];
  if(typeof v[0]!=='number'||!v.slice(1).every(c=>typeof c==='string'&&c.trim()))throw Error(`Incomplete history row ${i+4}`);
  return [{row:i+4,applicationDate:new Date(Date.UTC(1899,11,30)+v[0]*86400000).toISOString().slice(0,10),company:v[1],city:v[2],title:v[3],applicationStatusText:v[4],status:historyStatus(v[4])}];
 });
}
export function mergeApplicationHistory(data,history,source){
 const outcomes=[],now=new Date().toISOString();
 for(const h of history){
  const matches=data.jobs.filter(j=>identity(j.company,j.applicationCity||j.city,j.title)===identity(h.company,h.city,h.title));
  if(matches.length>1){outcomes.push({row:h.row,outcome:'ambiguous',company:h.company,title:h.title});continue;}
  let job=matches[0];
  if(job?.applicationDate){
   outcomes.push({row:h.row,outcome:job.applicationDate===h.applicationDate?'unchanged':'ambiguous',id:job.id});continue;
  }
  if(job&&!['New','Shortlisted'].includes(job.status)){outcomes.push({row:h.row,outcome:'ambiguous',reason:'Existing application stage requires review',id:job.id});continue;}
  const outcome=job?'merged':'added';
  if(!job){job={id:crypto.randomUUID(),company:h.company,title:h.title,city:h.city,countries:[],country:'',group:'',fit:null,locationRaw:h.city,workMode:'Unknown',workModeRaw:'',seniority:'',postedDate:'',firstSeen:h.applicationDate,assessmentBasis:'Title only',availability:'Unverified',url:'',linkType:'search',reasoning:'Historical application; posting and fit have not been reassessed.',gaps:'',status:'New',notes:'',sources:[]};data.jobs.push(job);}
  Object.assign(job,{firstSeen:h.applicationDate,applicationDate:h.applicationDate,applicationCity:h.city,applicationStatusText:h.applicationStatusText,applicationSourceRow:h.row,status:h.status,updatedAt:now});
  job.sources.push({label:'Application history',url:'',file:path.basename(source),sheet:'Übersicht',row:h.row});
  outcomes.push({row:h.row,outcome,id:job.id});
 }
 return {outcomes,added:outcomes.filter(o=>o.outcome==='added').length,merged:outcomes.filter(o=>o.outcome==='merged').length,unchanged:outcomes.filter(o=>o.outcome==='unchanged').length,ambiguous:outcomes.filter(o=>o.outcome==='ambiguous').length};
}
export async function importApplicationHistory({root=dataRoot,file,apply=false}){
 const history=await readApplicationHistory(file);
 return commit(root,data=>{const result=mergeApplicationHistory(data,history,file);if(result.ambiguous)throw Error('History contains ambiguous matches: '+JSON.stringify(result.outcomes.filter(o=>o.outcome==='ambiguous')));return {...result,skipWrite:!apply||!result.added&&!result.merged};},{tag:'jobs-history'});
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
 try{console.log(JSON.stringify(await importApplicationHistory({root:arg('--root')||dataRoot,file:arg('--file')||path.join(dataRoot,'Bewerbungsuebersicht-template.xlsx'),apply:args.includes('--apply')})));}
 catch(e){console.error(e.message);process.exitCode=1;}
}
