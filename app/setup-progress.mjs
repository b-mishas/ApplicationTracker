// Source obligations and attended orphan recovery. No inventory writes or inferred historical scope.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {withLock,writeJsonAtomic} from './store.mjs';
import {open as openFinds,rowsOf,findOf,strongIds} from './capture-check.mjs';

const assert=(ok,message)=>{if(!ok)throw Error(message);};
const instant=value=>typeof value==='string' && /Z$/.test(value) && Number.isFinite(Date.parse(value));
const sha=value=>typeof value==='string' && /^[a-f0-9]{64}$/.test(value);
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const parse=raw=>JSON.parse(raw.replace(/^\uFEFF/,''));
const read=async file=>parse(await fs.readFile(file,'utf8'));
const optional=async file=>{try{return await read(file);}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const runsPath=root=>path.join(root,'data/reports/runs');
const runPath=(root,id)=>{assert(typeof id==='string' && /^[\w-][\w.-]*$/.test(id) && !['.','..'].includes(id),'Invalid run ID');return path.join(runsPath(root),id);};
const keyOf=(kind,source)=>`${kind}|${source}`;
const choices=value=>{
 assert(value && ['employer','portal'].every(kind=>Array.isArray(value[kind]) && value[kind].every(name=>typeof name==='string' && name.trim())),'Due selection needs employer and portal arrays');
 return ['employer','portal'].flatMap(kind=>value[kind].map(source=>({kind,source})));
};
function validSelection(journal,runId){
 assert(journal.schemaVersion===1 && journal.runId===runId && Array.isArray(journal.sources),'Invalid due-selection journal; preserve and recover it');
 const keys=new Set();
 for(const item of journal.sources){
  assert(item && instant(item.selectedAt) && typeof item.selectionId==='string' && item.selectionId && ['employer','portal'].includes(item.kind) && typeof item.source==='string' && item.source,'Invalid persisted source obligation');
  const key=keyOf(item.kind,item.source);assert(!keys.has(key),'Conflicting duplicate source obligations; preserve and recover the journal');keys.add(key);
 }
}

// Journal selection times before replacing compatible due.json. Resumes preserve generations and the union of work.
export async function selectSources(root,runId,selected){
 const dir=runPath(root,runId);choices(selected);
 return withLock(dir,async()=>{
  const manifest=await read(path.join(dir,'run-completion.json'));
  assert(manifest.runId===runId && instant(manifest.startedAt),'Run identity/start time required before selecting sources');
  const file=path.join(dir,'due-selection.json'),previous=await optional(file),due=await optional(path.join(dir,'due.json'));
  if(previous)validSelection(previous,runId);
  const sources=new Map((previous?.sources||[]).map(item=>{
   assert(instant(item.selectedAt) && typeof item.selectionId==='string' && ['employer','portal'].includes(item.kind) && typeof item.source==='string','Invalid persisted source obligation');
   return [keyOf(item.kind,item.source),item];
  }));
  // Legacy due lists have a stable run-start lower bound. Never replace it with a resume/file-write time.
  for(const item of due?choices(due):[])if(!sources.has(keyOf(item.kind,item.source)))sources.set(keyOf(item.kind,item.source),{...item,selectedAt:manifest.startedAt,selectionId:`${runId}:legacy:${keyOf(item.kind,item.source)}`});
  const now=new Date().toISOString();
  for(const item of choices(selected))if(!sources.has(keyOf(item.kind,item.source)))sources.set(keyOf(item.kind,item.source),{...item,selectedAt:now,selectionId:crypto.randomUUID()});
  const journal={schemaVersion:1,runId,sources:[...sources.values()]};
  await writeJsonAtomic(file,journal);
  const next=Object.fromEntries(['employer','portal'].map(kind=>[kind,journal.sources.filter(s=>s.kind===kind).map(s=>s.source)]));
  await writeJsonAtomic(path.join(dir,'due.json'),next);
  return journal;
 });
}

// Completed selective transitions retain source work from the previous scope. An all-source reset starts a new era.
async function scopeEras(root,state,scope,reset,blockers){
 const receipts=[];
 if(reset.receipt?.status==='complete')receipts.push(reset.receipt);
 const backups=path.join(root,'data/reports/setup-backups');
 for(const name of await fs.readdir(backups).catch(e=>{if(e.code==='ENOENT')return [];throw e;}))if(/^scope-.*\.json$/.test(name)){
  try{const receipt=await read(path.join(backups,name));if(receipt.status==='complete')receipts.push(receipt);}catch{blockers.push(`Invalid archived scope transition ${name}`);}
 }
 const eras=[],seen=new Set();let current=scope,before=Infinity,discard=new Set();
 for(;;){
  const matching=receipts.filter(r=>r.scope===current && instant(r.completedAt) && Date.parse(r.completedAt)<before).sort((a,b)=>Date.parse(b.completedAt)-Date.parse(a.completedAt));
  const receipt=matching[0];
  if(!receipt){eras.push({scope:current,after:-Infinity,before,discard});break;}
  if(receipt.mode!==undefined && !['all','employers'].includes(receipt.mode)){blockers.push('Archived reset has an invalid replay mode');break;}
  const completed=Date.parse(receipt.completedAt),token=`${current}:${completed}`;
  if(seen.has(token)){blockers.push('Scope transition cycle');break;}seen.add(token);
  eras.push({scope:current,after:completed,before,discard});
  if(receipt.mode!=='employers')break;
  if(receipt.setupId!==state.setupId || !sha(receipt.fromScope) || !Array.isArray(receipt.employers)){
   blockers.push('Selective reset lacks a verified previous-scope transition; review history or perform an explicit full replay');break;
  }
  discard=new Set([...discard,...receipt.employers.map(name=>keyOf('employer',name))]);
  current=receipt.fromScope;before=completed;
 }
 return eras;
}

async function sourceEvidence(dir){
 const files=await fs.readdir(dir),rows=[];
 for(const file of files.filter(name=>name==='source-evidence.jsonl' || /^evidence-.*\.jsonl$/.test(name)))for(const value of rowsOf(path.join(dir,file))){
  assert(['employer','portal','alerts','refresh'].includes(value.kind) && typeof value.source==='string' && value.source && instant(value.at) && ['checked','partial','deferred','failed'].includes(value.status),'Invalid source evidence');rows.push(value);
 }
 return {files,rows};
}
function addOutcome(outcomes,value){
 const key=keyOf(value.kind,value.source),at=Date.parse(value.at),old=outcomes.get(key);
 if(!old || at>old.at)outcomes.set(key,{at,status:value.status});
 else if(at===old.at && value.status!==old.status)outcomes.set(key,{at,status:'conflict'});
}

// Every file (including nested delegated results) participates in the recovery fingerprint. Symlinks are not followed.
async function folderFiles(dir,prefix=''){
 const files={};
 for(const entry of await fs.readdir(path.join(dir,prefix),{withFileTypes:true})){
  const rel=prefix?`${prefix}/${entry.name}`:entry.name;
  if(!prefix && (entry.name==='setup-recovery.json' || entry.name==='jobs.json.lock' || entry.name.startsWith('jobs.json.lock.released-')))continue;
  assert(!entry.isSymbolicLink(),`Cannot classify symlink ${rel}`);
  if(entry.isDirectory())Object.assign(files,await folderFiles(dir,rel));
  else{assert(entry.isFile(),`Unsupported evidence entry ${rel}`);files[rel]=hash(await fs.readFile(path.join(dir,rel)));}
 }
 return Object.fromEntries(Object.entries(files).sort(([a],[b])=>a<b?-1:a>b?1:0));
}
async function within(dir,rel){
 assert(typeof rel==='string' && rel && !path.isAbsolute(rel),'Recovery path must be relative');
 const base=await fs.realpath(dir),target=await fs.realpath(path.resolve(dir,rel)),part=path.relative(base,target);
 assert(part && !part.startsWith('..') && !path.isAbsolute(part),'Recovery path escapes its folder');return target;
}
async function verifyRecovery(root,runId,receipt){
 const dir=runPath(root,runId),files=await folderFiles(dir);
 assert(receipt.schemaVersion===1 && receipt.runId===runId && typeof receipt.evidence==='string' && receipt.evidence.trim(),'Recovery classification/evidence missing');
 assert(JSON.stringify(receipt.files)===JSON.stringify(files),'Orphan evidence changed since classification; inspect again');
 if(receipt.kind==='empty'){
  for(const rel of Object.keys(files))assert(['run-ledger.jsonl','source-evidence.jsonl'].includes(rel) && !(await fs.readFile(path.join(dir,rel),'utf8')).trim(),'Empty classification permits only empty initialization ledgers; inspect all other results');
  return;
 }
 assert(receipt.kind==='handover' && receipt.targetRun!==runId && Array.isArray(receipt.transfers),'Invalid handover');
 const target=runPath(root,receipt.targetRun),manifest=await read(path.join(target,'run-completion.json'));
 const state=await read(path.join(root,'data/reports/setup-state.json'));
 assert(manifest.status==='finished' && manifest.setupId===state.setupId && manifest.setupId===receipt.setupId && sha(manifest.setupScope) && manifest.setupScope===receipt.targetScope && instant(manifest.startedAt),'Finished handover target identity is missing/stale');
 const taken=manifest.recoveredOrphans?.find(item=>item.runId===runId);
 assert(taken && Array.isArray(taken.files),'Target must explicitly record recoveredOrphans and consumed file references');
 assert(receipt.transfers.length===Object.keys(files).length && new Set(receipt.transfers.map(t=>t.file)).size===Object.keys(files).length,'Every orphan file needs one reviewed transfer');
 const ledger=rowsOf(path.join(target,'run-ledger.jsonl')).map(findOf),outcomes=new Map();
 for(const value of (await sourceEvidence(target)).rows)addOutcome(outcomes,value);
 for(const transfer of receipt.transfers){
  assert(files[transfer.file] && ['finds','sources','due','reading','support'].includes(transfer.kind),'Invalid reviewed file disposition');
  assert(taken.files.includes(transfer.target),'Target has not recorded this result as consumed');
  assert(hash(await fs.readFile(await within(target,transfer.target)))===files[transfer.file],'Transferred result is missing or differs');
  if(transfer.file==='run-ledger.jsonl')assert(transfer.kind==='finds','Ledger must be verified as finds');
  if(/(^|\/)(source-evidence|evidence-.*)\.jsonl$/.test(transfer.file))assert(transfer.kind==='sources','Source outcomes need explicit verification');
  if(['due.json','due-selection.json'].includes(transfer.file))assert(transfer.kind==='due','Due work needs explicit verification');
  if(transfer.kind==='finds')for(const row of rowsOf(path.join(dir,transfer.file))){
   const find=findOf(row),ids=strongIds(find);
   assert(find.company && find.title,'Find extraction is ambiguous; reconstruct evidence before classifying');
   assert(ledger.some(other=>other.company===find.company && (ids.length?strongIds(other).some(id=>ids.includes(id)):other.title===find.title && other.location===find.location)),'A recovered find is missing from the target ledger');
  }
  const selection=transfer.kind==='due'?await read(path.join(dir,transfer.file)):null;
  const obligations=transfer.kind==='sources'?rowsOf(path.join(dir,transfer.file)):selection?(selection.sources||choices(selection)):[];
  for(const item of obligations){const outcome=outcomes.get(keyOf(item.kind,item.source));assert(outcome?.status==='checked' && outcome.at>=Math.max(Date.parse(manifest.startedAt),instant(item.selectedAt)?Date.parse(item.selectedAt):-Infinity),'Recovered source work lacks a successful target-run check');}
  if(transfer.kind==='reading')assert(/^read-.*\.jsonl$/.test(transfer.target),'Reading evidence must be available to finish-run at the target run root');
 }
}
export async function classifyOrphan(root,runId,input){
 const dir=runPath(root,runId);
 return withLock(dir,async()=>{
  const manifest=await optional(path.join(dir,'run-completion.json'));
  assert(!manifest?.setupId || !manifest?.setupScope,'Tagged run is not an orphan; do not bypass its obligations');
  const target=input.kind==='handover'?await read(path.join(runPath(root,input.targetRun),'run-completion.json')):null;
  const receipt={...input,...(target?{setupId:target.setupId,targetScope:target.setupScope}:{}),schemaVersion:1,runId,classifiedAt:new Date().toISOString(),files:await folderFiles(dir)};
  await verifyRecovery(root,runId,receipt);
  const file=path.join(dir,'setup-recovery.json'),old=await fs.readFile(file).catch(e=>{if(e.code==='ENOENT')return null;throw e;});
  if(old){const backups=path.join(root,'data/reports/setup-backups');await fs.mkdir(backups,{recursive:true});await fs.writeFile(path.join(backups,`recovery-${runId}-${Date.now()}-${crypto.randomUUID()}.json`),old,{flag:'wx'});}
  await writeJsonAtomic(file,receipt);return receipt;
 });
}

export async function setupSearchProgress(root,state,snapshot,reset){
 const blockers=[],runs=[],unknown=[],folder=runsPath(root),eras=await scopeEras(root,state,snapshot.scope,reset,blockers);
 for(const entry of await fs.readdir(folder,{withFileTypes:true}).catch(e=>{if(e.code==='ENOENT')return [];throw e;}))if(entry.isDirectory()){
  const runId=entry.name,dir=runPath(root,runId);
  try{
   const manifest=await optional(path.join(dir,'run-completion.json'));
   if(!manifest?.setupId || !manifest?.setupScope){
    const recovery=await optional(path.join(dir,'setup-recovery.json'));
    if(recovery){await verifyRecovery(root,runId,recovery);continue;}
   }
   if(!manifest){if(Object.keys(await folderFiles(dir)).length)unknown.push({runId,at:null});continue;}
   if(manifest.setupDiscovery===true)continue;
   const at=instant(manifest.startedAt)?Date.parse(manifest.startedAt):null;
   if(manifest.setupId===state.setupId && eras.some(era=>era.scope===manifest.setupScope)){
    assert(at!==null && manifest.runId===runId,'Invalid run identity/start evidence');
    const era=eras.find(era=>era.scope===manifest.setupScope && at>=era.after && at<era.before);
    if(era)runs.push({runId,manifest,at,era});
   }else if(!manifest.setupId || !manifest.setupScope)unknown.push({runId,at});
  }catch(error){blockers.push(`Run ${runId} cannot be classified: ${error.message}`);}
 }
 runs.sort((a,b)=>a.at-b.at || (a.runId<b.runId?-1:1));
 if(reset.blocker)blockers.push(reset.blocker);
 const current=runs.filter(run=>run.era===eras[0]),latest=current.at(-1);
 if(!latest){if(unknown.length)blockers.push('Search evidence needs explicit orphan classification');return {status:blockers.length?'partial':'not_started',scope:snapshot.scope,runIds:runs.map(r=>r.runId),latestRunId:null,sourceObligations:[],blockers};}
 for(const run of unknown)if(run.at===null || run.at>=runs[0].at)blockers.push(`Run ${run.runId} needs explicit orphan classification or verified handover`);
 if(current.length>1 && current.at(-2).at===latest.at)blockers.push('Latest search run is ambiguous: equal start times');
 const due=new Map(),outcomes=new Map();
 for(const {runId,manifest,at,era} of runs){
  const dir=runPath(root,runId),isLatest=runId===latest.runId;
  if(isLatest){
   if(manifest.status!=='finished')blockers.push(`Run ${runId} is unfinished`);
   try{const finish=await read(path.join(dir,'finish.json'));assert(finish.runId===runId && Array.isArray(finish.retry) && ['complete','partial'].includes(finish.searchCoverage),'Invalid finish evidence');if(finish.retry.length || finish.searchCoverage!=='complete')blockers.push(`Latest run ${runId} still has incomplete search/retry work`);}catch(error){blockers.push(`Run ${runId} lacks trustworthy finish evidence: ${error.message}`);}
  }
  try{
   const selected=await optional(path.join(dir,'due.json')),journal=await optional(path.join(dir,'due-selection.json'));
   assert(selected || journal || !isLatest,'Missing due list');
   if(journal)validSelection(journal,runId);
   const items=new Map((journal?.sources||[]).map(item=>[keyOf(item.kind,item.source),item]));
   for(const item of selected?choices(selected):[])if(!items.has(keyOf(item.kind,item.source)))items.set(keyOf(item.kind,item.source),{...item,selectedAt:manifest.startedAt});
   for(const item of items.values()){
    assert(['employer','portal'].includes(item.kind) && typeof item.source==='string' && instant(item.selectedAt) && Date.parse(item.selectedAt)>=at,'Source obligation lacks stable timing');
    const key=keyOf(item.kind,item.source);if(!era.discard.has(key))due.set(key,Math.max(due.get(key)||-Infinity,Date.parse(item.selectedAt)));
   }
   const evidence=await sourceEvidence(dir);assert(evidence.files.includes('source-evidence.jsonl') || !isLatest,'Source evidence missing');
   for(const value of evidence.rows){assert(Date.parse(value.at)>=at,'Source evidence predates this run');if(!era.discard.has(keyOf(value.kind,value.source)))addOutcome(outcomes,value);}
  }catch(error){blockers.push(`Run ${runId} has incomplete source evidence: ${error.message}`);}
 }
 const sourceObligations=[];
 // Compare the full recorded instants. Rounding a selection down would let an earlier same-second check pass.
 for(const [key,selectedAt] of due){
  const outcome=outcomes.get(key);
  if(!outcome || outcome.at<selectedAt || outcome.status!=='checked'){
   const split=key.indexOf('|');sourceObligations.push({kind:key.slice(0,split),source:key.slice(split+1),selectedAt:new Date(selectedAt).toISOString()});
   if(!outcome || outcome.at<selectedAt)blockers.push(`Due source ${key} has no outcome after its selection`);
  }
 }
 for(const [key,outcome] of outcomes)if(outcome.status!=='checked'){
  blockers.push(`Source ${key} remains ${outcome.status}`);
  const split=key.indexOf('|'),kind=key.slice(0,split),source=key.slice(split+1);
  if(['employer','portal'].includes(kind) && !due.has(key))sourceObligations.push({kind,source,selectedAt:new Date(outcome.at).toISOString()});
 }
 try{const coverage=await read(path.join(root,'data/reports/coverage.json'));assert(Array.isArray(coverage.unfinished),'Coverage unfinished-work evidence missing');if(coverage.unfinished.length)blockers.push('Coverage still records unfinished source work');if(openFinds(path.join(root,'data')).some(line=>line.startsWith('open | ')))blockers.push('Captured vacancies still need work');}catch(error){blockers.push(`Current search evidence cannot be reconciled: ${error.message}`);}
 return {status:blockers.length?'partial':'complete',scope:snapshot.scope,runIds:runs.map(r=>r.runId),latestRunId:latest.runId,sourceObligations,blockers};
}
