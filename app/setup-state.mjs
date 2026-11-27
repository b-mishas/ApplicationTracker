// Private setup coordination. Facts stay in the profile/workbook; this file stores approvals and evidence references.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {withLock, writeJsonAtomic} from './store.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {open as openFinds} from './capture-check.mjs';

export const TOPICS = {background:[1], roles:[2], seniority:[3], geography:[4], strengthsGaps:[5,6,7,9], calibration:[8], sources:[10], employers:[], personalSettings:[]};
const STATES = ['missing','draft','needs_answer','approved','needs_review'];
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const digest = value => hash(JSON.stringify(value));
const read = async file => JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
const optional = async file => {try{return await fs.readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const instant = value => typeof value==='string' && /Z$/.test(value) && Number.isFinite(Date.parse(value));
const assert = (test,message) => {if(!test)throw Error(message);};
const record = value => value && typeof value==='object' && !Array.isArray(value);
const statePath = root => path.join(root,'data/reports/setup-state.json');
const canonical = text => text.replace(/\r\n/g,'\n').trim();
export async function readSetupReset(root){
 const raw=await optional(path.join(root,'data/reports/setup-scope-reset.json'));
 if(raw===null)return null;
 const receipt=JSON.parse(raw.replace(/^\uFEFF/,''));
 assert(receipt.schemaVersion===1 && /^[a-f0-9]{64}$/.test(receipt.scope) && ['started','complete'].includes(receipt.status) && instant(receipt.startedAt) && record(receipt.previousCoverage),'Malformed or unsupported setup reset receipt; preserve it and recover explicitly');
 assert(receipt.status!=='complete' || instant(receipt.completedAt),'Completed setup reset lacks a valid completion time');
 return receipt;
}
async function resetReadiness(root){
 try{
  const receipt=await readSetupReset(root);
  return {receipt,blocker:receipt?.status==='started'?'An unfinished setup reset must be recovered before activation or searching':null};
 }catch(error){return {receipt:null,blocker:`Setup reset receipt cannot be trusted: ${error.message}`};}
}
// References are relative to this installation. Reject escaping paths, including symlinks.
async function reference(root,ref){
 assert(typeof ref==='string' && ref && !path.isAbsolute(ref),'Evidence needs a relative path');
 const base=await fs.realpath(root), target=await fs.realpath(path.resolve(root,ref));
 const rel=path.relative(base,target);
 assert(rel && !rel.startsWith('..') && !path.isAbsolute(rel),'Evidence escapes ROOT');
 return target;
}
export async function setupSnapshot(root){
 const profile=await optional(path.join(root,'profile/candidate_profile.md')) || '';
 const filled=await optional(path.join(root,'agent/ROUTINE_PROMPT.filled.md')) || '';
 const routine=await optional(path.join(root,'agent/ROUTINE_PROMPT.md')) || '';
 const sections={};
 for(const match of profile.matchAll(/^## (\d+)\.[^\n]*\n([\s\S]*?)(?=^## \d+\.|$(?![\s\S]))/gm))sections[Number(match[1])]=canonical(match[0]);
 const partB=text=>text.slice(text.indexOf('## Part B'));
 const promptValid=filled.includes('## Part B') && routine.includes('## Part B') && partB(filled)===partB(routine) && !/\{\{[^}]*\}\}/.test(filled);
 let employers=null;
 try{employers=(await employerWorkbook({file:path.join(root,'profile/companies.xlsx')})).employers
  .map(({row,_ignored,...values})=>Object.fromEntries(Object.entries(values).filter(([key])=>!['#','Last checked','Careers page'].includes(key))))
  .sort((a,b)=>a.Company.localeCompare(b.Company));}catch(e){if(e.code!=='ENOENT')throw e;}
 const fingerprints={};
 for(const [topic,ids] of Object.entries(TOPICS)){
  const value=topic==='employers'?employers:topic==='personalSettings'?(filled?canonical(filled.split('## Part B')[0]):null):ids.map(id=>sections[id]||null);
  fingerprints[topic]=value && (ids.length?value.every(Boolean):topic==='employers'?value.length>0:true)?digest(value):null;
 }
 const searchSettings=canonical(filled.split('## Part B')[0]).split('\n').filter(line=>/Gmail label with job alerts:|Time zone for dates and deadlines:|First search goes back:/.test(line));
 // The template's Name field is descriptive. Keep every other background line (including unknown prose)
 // as a dependency so authorization, experience, location and language edits cannot silently evade review.
 const backgroundInputs=sections[1]?canonical(sections[1].split('\n').filter(line=>!/^\s*(?:[-*]\s+)?Name\s*:/i.test(line)).join('\n')):null;
 const assessmentBasis=digest({backgroundInputs,topics:['roles','seniority','geography','strengthsGaps'].map(id=>fingerprints[id])});
 const scope=digest({backgroundInputs,topics:['roles','seniority','geography','strengthsGaps','sources','employers'].map(id=>fingerprints[id]),searchSettings});
 return {fingerprints,scope,assessmentBasis,promptValid,profileValid:!!profile && !/\{\{[^}]*\}\}|^\s*-?\s*Example:/m.test(profile),promptFingerprint:filled?hash(filled):null,root:await fs.realpath(root)};
}
export function validateSetup(state){
 assert(record(state) && state.schemaVersion===1,'Unsupported or malformed setup state; preserve it and recover explicitly');
 const allowed=['schemaVersion','setupId','updatedAt','phase','topics','questions','capabilities','limitations','discoveryRuns','task','scopeReview','finalApproval','verification','quiescence','lastActiveScope'];
 assert(Object.keys(state).every(key=>allowed.includes(key)),'Unknown setup field; keep personal facts in authoritative artifacts');
 assert(typeof state.setupId==='string' && state.setupId && instant(state.updatedAt),'Invalid setup identity/time');
 assert(['editing','active'].includes(state.phase),'Invalid setup phase');
 assert(record(state.topics) && Object.keys(state.topics).length===Object.keys(TOPICS).length,'Invalid topics');
 for(const id of Object.keys(TOPICS)){
  const t=state.topics[id];assert(record(t) && STATES.includes(t.status),`Invalid topic ${id}`);
  if(t.status==='approved')assert(t.approval?.by==='user' && instant(t.approval.at) && typeof t.approval.evidence==='string' && t.approval.evidence.trim() && /^[a-f0-9]{64}$/.test(t.approval.fingerprint),`Approval evidence missing for ${id}`);
 }
 assert(Array.isArray(state.questions) && new Set(state.questions.map(q=>q.id)).size===state.questions.length,'Invalid/duplicate pending questions');
 for(const q of state.questions)assert(typeof q.id==='string' && q.id && typeof q.question==='string' && Array.isArray(q.topics) && q.topics.length && q.topics.every(id=>id in TOPICS) && ['unknown','declined','not_applicable'].includes(q.answer) && typeof q.blocking==='boolean','Invalid pending question');
 assert(record(state.capabilities) && Array.isArray(state.limitations) && Array.isArray(state.discoveryRuns),'Invalid evidence collections');
 for(const c of Object.values(state.capabilities))assert(['untested','verified','failed','unavailable'].includes(c.status) && ['interactive','scheduled'].includes(c.context) && instant(c.observedAt) && typeof c.ref==='string','Invalid capability');
 for(const l of state.limitations)assert(typeof l.consequence==='string' && typeof l.profileRef==='string' && l.acceptedBy==='user' && instant(l.acceptedAt),'Limitations need explicit acceptance and a profile reference');
 return state;
}
export async function readSetup(root){
 const raw=await optional(statePath(root));
 return {state:raw===null?null:validateSetup(JSON.parse(raw.replace(/^\uFEFF/,''))),revision:raw===null?'missing':hash(raw)};
}
// Operational verification is historical. Search progress follows all runs of this installation/scope,
// carrying unresolved source outcomes forward until a later dated check actually resolves them.
async function setupSearchProgress(root,state,snapshot,reset){
 const blockers=[],runs=[],unknown=[],folder=path.join(root,'data/reports/runs');
 const boundary=reset.receipt?.status==='complete'?Date.parse(reset.receipt.completedAt):-Infinity;
 let names=[];
 try{names=await fs.readdir(folder,{withFileTypes:true});}catch(e){if(e.code!=='ENOENT')throw e;}
 for(const entry of names.filter(e=>e.isDirectory())){
  const runId=entry.name,manifestFile=path.join(folder,runId,'run-completion.json');
  try{
   const raw=await optional(manifestFile);
   if(raw===null){
    if((await fs.readdir(path.dirname(manifestFile))).some(name=>/^(run-ledger|source-evidence|evidence-.*)\.jsonl$/.test(name)))unknown.push({runId,at:null});
    continue;
   }
   const manifest=JSON.parse(raw.replace(/^\uFEFF/,'')),at=instant(manifest.startedAt)?Date.parse(manifest.startedAt):null;
   if(manifest.setupId===state.setupId && manifest.setupScope===snapshot.scope){
    if(at===null || manifest.runId!==runId){blockers.push(`Run ${runId} has invalid identity/start evidence`);continue;}
    if(at>=boundary)runs.push({runId,manifest,at});
   }else if(!manifest.setupId || !manifest.setupScope)unknown.push({runId,at});
  }catch(error){blockers.push(`Run ${runId} cannot be classified: ${error.message}`);}
 }
 runs.sort((a,b)=>a.at-b.at || a.runId.localeCompare(b.runId));
 if(reset.blocker)blockers.push(reset.blocker);
 if(!runs.length){
  if(unknown.length)blockers.push('Search evidence exists without installation/scope identity; classify it before claiming progress');
  return {status:blockers.length?'partial':'not_started',scope:snapshot.scope,runIds:[],latestRunId:null,blockers};
 }
 for(const run of unknown)if(run.at===null || run.at>=runs[0].at)blockers.push(`Run ${run.runId} needs installation/scope evidence before its work can be classified`);
 const latest=runs.at(-1),outcomes=new Map(),due=new Set();
 if(runs.length>1 && runs.at(-2).at===latest.at)blockers.push('Latest search run is ambiguous: equal start times');
 for(const {runId,manifest} of runs){
  const dir=path.join(folder,runId);
  if(manifest.status!=='finished')blockers.push(`Run ${runId} is unfinished`);
  try{
   const finish=await read(path.join(dir,'finish.json'));
   assert(finish.runId===runId && Array.isArray(finish.retry) && ['complete','partial'].includes(finish.searchCoverage),'Invalid finish evidence');
   // The latest reconciled finish covers vacancy/reading/import retries. Older source failures additionally
   // require newer source evidence below; a newer "complete" label alone cannot erase them.
   if(runId===latest.runId && (finish.retry.length || finish.searchCoverage!=='complete'))blockers.push(`Latest run ${runId} still has incomplete search/retry work`);
  }catch(error){blockers.push(`Run ${runId} lacks trustworthy finish evidence: ${error.message}`);}
  try{
   const selected=await read(path.join(dir,'due.json'));
   for(const kind of ['employer','portal']){
    assert(Array.isArray(selected[kind]),`Missing ${kind} due list`);
    for(const name of selected[kind]){assert(typeof name==='string' && name,'Invalid due source');due.add(`${kind}|${name}`);}
   }
   const files=await fs.readdir(dir),evidenceFiles=files.filter(name=>name==='source-evidence.jsonl' || /^evidence-.*\.jsonl$/.test(name));
   assert(files.includes('source-evidence.jsonl'),'Source evidence missing');
   for(const file of evidenceFiles)for(const line of (await fs.readFile(path.join(dir,file),'utf8')).split(/\r?\n/).filter(s=>s.trim())){
    const evidence=JSON.parse(line.replace(/^\uFEFF/,''));
    assert(['employer','portal','alerts','refresh'].includes(evidence.kind) && typeof evidence.source==='string' && evidence.source && instant(evidence.at) && ['checked','partial','deferred','failed'].includes(evidence.status),'Invalid source evidence');
    assert(Date.parse(evidence.at)>=Date.parse(manifest.startedAt),'Source evidence predates this run');
    const key=`${evidence.kind}|${evidence.source}`,at=Date.parse(evidence.at),old=outcomes.get(key);
    if(!old || at>old.at)outcomes.set(key,{at,status:evidence.status});
    else if(at===old.at && evidence.status!==old.status)outcomes.set(key,{at,status:'conflict'});
   }
  }catch(error){blockers.push(`Run ${runId} has incomplete source evidence: ${error.message}`);}
 }
 for(const key of due)if(!outcomes.has(key))blockers.push(`Due source ${key} has no dated outcome`);
 for(const [key,outcome] of outcomes)if(outcome.status!=='checked')blockers.push(`Source ${key} remains ${outcome.status}`);
 try{
  const coverage=await read(path.join(root,'data/reports/coverage.json'));
  assert(record(coverage) && Array.isArray(coverage.unfinished),'Coverage unfinished-work evidence is missing');
  if(coverage.unfinished.length)blockers.push('Coverage still records unfinished source work');
  if(openFinds(path.join(root,'data')).some(line=>line.startsWith('open | ')))blockers.push('Captured vacancies still need work');
 }catch(error){blockers.push(`Current search evidence cannot be reconciled: ${error.message}`);}
 return {status:blockers.length?'partial':'complete',scope:snapshot.scope,runIds:runs.map(r=>r.runId),latestRunId:latest.runId,blockers};
}
export async function inspectSetup(root,state){
 const snapshot=await setupSnapshot(root);
 const reset=await resetReadiness(root),blockers=[];
 const block=(code,message,topic)=>blockers.push({code,message,...(topic?{topic}:{})});
 if(reset.blocker)block('setup_reset',reset.blocker);
 if(!state)return {snapshot,blockers,topics:Object.fromEntries(Object.keys(TOPICS).map(id=>[id,'missing'])),personalizationReady:false,scheduledOperationVerified:false,initialSearch:'not_started',next:reset.blocker||'Reconcile existing artifacts and initialize setup; no approvals inferred'};
 validateSetup(state);
 const topics={},topicBlockers={};
 for(const id of Object.keys(TOPICS)){
  const t=state.topics[id];topics[id]=t.status==='approved' && t.approval.fingerprint!==snapshot.fingerprints[id]?'needs_review':t.status;
  topicBlockers[id]=topics[id]==='approved'?[]:[topics[id]==='needs_review' && t.status==='approved'?'Approved content differs from the current artifact':`Topic is ${topics[id]}`];
 }
 // Calibration depends on the facts/rules used to rate examples, not only section 8 itself.
 const calibrationBasis=snapshot.assessmentBasis;
 for(const id of ['calibration','sources','employers'])if(state.topics[id].status==='approved' && state.topics[id].basis!==calibrationBasis){
  topics[id]='needs_review';
  const label=id==='calibration'?'Calibration':id==='sources'?'Source suitability':'Employer suitability';
  const field=id==='calibration'?'calibrationBasis':'suitabilityBasis';
  topicBlockers[id].push(state.topics[id].basis?`${label} approval predates the current assessment inputs`:`${label} approval is missing dependency evidence; save basis: readiness.${field} after review`);
 }
 for(const [id,reasons] of Object.entries(topicBlockers))for(const message of reasons)block('topic_review',message,id);
 // Mounted scheduled environments may expose ROOT under another path; installation identity must survive that mapping.
 const configuration=digest({topics:snapshot.fingerprints,prompt:snapshot.promptFingerprint,installation:state.setupId,task:state.task?{id:state.task.id,platform:state.task.platform,schedule:state.task.schedule,root:state.task.root}:null});
 let scopeReviewed=state.scopeReview?.fingerprint===snapshot.scope && typeof state.scopeReview?.evidence==='string' && !!state.scopeReview.evidence.trim();
 // Legacy coverage may describe a narrower search. A scope change needs a completed replay reset, not a status flag.
 const priorCoverage=await optional(path.join(root,'data/reports/coverage.json'));
 if(scopeReviewed && priorCoverage!==null && state.lastActiveScope!==snapshot.scope){
  scopeReviewed=reset.receipt?.status==='complete' && reset.receipt.scope===snapshot.scope;
 }
 if(!snapshot.profileValid)block('profile','Profile has unresolved placeholders/examples or is missing');
 if(!snapshot.promptValid)block('prompt','Filled prompt is missing, has placeholders or differs from current Part B');
 if(!scopeReviewed)block('scope_review','Scope review or completed replay evidence is missing/stale');
 for(const question of state.questions)if(question.blocking && question.answer!=='not_applicable')block('question',`Blocking decision ${question.id} is ${question.answer}`);
 if(!(state.finalApproval?.by==='user' && state.finalApproval?.fingerprint===configuration && instant(state.finalApproval.at)))block('final_approval','Final assembled configuration approval is missing/stale');
 const personalizationReady=blockers.length===0;
 let scheduledOperationVerified=false, verificationError=null;
 try{
  const v=state.verification, task=state.task;
  if(v){
   assert(v.configuration===configuration && v.context==='scheduled','Verification configuration/context is stale');
   assert(task?.id && ['claude','codex'].includes(task.platform) && task.schedule && task.root,'Missing installed task identity/schedule/ROOT');
   assert(hash(await fs.readFile(await reference(root,task.promptEvidence),'utf8'))===snapshot.promptFingerprint,'Installed prompt differs');
   assert(v.gmail==='verified','Required Gmail access unverified');
   const report=await read(await reference(root,v.importReport));
   assert(report.exitCode===0 && report.status==='imported','Successful non-dry-run import report required');
   const probe=await read(await reference(root,v.storageProbe));
   assert(probe.ok===true && probe.results?.some(r=>r.name==='Storage and backup' && r.ok),'Storage probe required in scheduled context');
   const finish=await read(await reference(root,`data/reports/runs/${v.runId}/finish.json`));
   assert(finish.runId===v.runId && Array.isArray(finish.retry),'Run finish evidence missing');
   assert(report.batch?.endsWith(`-${v.runId}.json`),'Import evidence belongs to another run');
   assert(['complete','partial'].includes(finish.searchCoverage),'Invalid search coverage');
   await reference(root,`data/reports/runs/${v.runId}/source-evidence.jsonl`);
   scheduledOperationVerified=personalizationReady && state.phase==='active';
  }
 }catch(e){verificationError=e.message;}
 const searchProgress=await setupSearchProgress(root,state,snapshot,reset);
 return {snapshot,calibrationBasis,suitabilityBasis:calibrationBasis,configuration,topics,topicBlockers,blockers,scopeReviewed,personalizationReady,scheduledOperationVerified,initialSearch:searchProgress.status,searchProgress,verificationError,next:!personalizationReady?blockers[0].message:state.phase!=='active'?'Activate after confirming schedules are safe':!scheduledOperationVerified?'Verify actual scheduled execution':'Report readiness and remaining search work separately'};
}
export async function saveSetup(root,proposed,expectedRevision){
 const folder=path.dirname(statePath(root));await fs.mkdir(folder,{recursive:true});
 return withLock(folder,async()=>{
  const current=await readSetup(root);assert(current.revision===expectedRevision,'Setup changed; reread before saving');
  const next=structuredClone(proposed);next.updatedAt=new Date().toISOString();validateSetup(next);
  assert(!current.state || current.state.setupId===next.setupId,'Cannot replace setup identity');
  assert(next.lastActiveScope===current.state?.lastActiveScope,'Only activation may set the active scope');
  if(current.state?.phase==='active' && next.phase==='editing')assert(next.quiescence?.confirmedStopped===true && instant(next.quiescence.at) && next.quiescence.evidence,'Confirm existing schedules paused and active runs stopped before editing');
  if(next.phase==='active'){
   const readiness=await inspectSetup(root,next);
   assert(readiness.personalizationReady,`Cannot activate incomplete/unapproved configuration: ${readiness.blockers.map(b=>b.message).join('; ')}`);
   next.lastActiveScope=(await setupSnapshot(root)).scope;
  }
  if(current.state)await writeJsonAtomic(path.join(folder,'setup-backups',`${Date.now()}-${crypto.randomUUID()}.json`),current.state);
  await writeJsonAtomic(statePath(root),next);
  return readSetup(root);
 });
}
export async function initializeSetup(root){
 const current=await readSetup(root);if(current.state)return current;
 const inventory=await read(path.join(root,'data/jobs.json'));
 assert(Array.isArray(inventory.jobs),'ROOT needs an initialized inventory before setup');
 await fs.access(path.join(root,'profile/candidate_profile.md'));await fs.access(path.join(root,'agent/ROUTINE_PROMPT.md'));
 const state={schemaVersion:1,setupId:crypto.randomUUID(),updatedAt:new Date().toISOString(),phase:'editing',topics:Object.fromEntries(Object.keys(TOPICS).map(id=>[id,{status:'missing'}])),questions:[],capabilities:{},limitations:[],discoveryRuns:[]};
 return saveSetup(root,state,'missing');
}
export async function setupGuard(root){
 const {state}=await readSetup(root);
 const reset=await resetReadiness(root);assert(!reset.blocker,reset.blocker);
 // Legacy installations remain usable; an existing malformed state must fail closed.
 if(!state)return {allowed:true,legacy:true};
 const result=await inspectSetup(root,state);
 assert(state.phase==='active' && result.personalizationReady,`Setup is editing or approvals are stale: stop before reading mail, searching or importing. ${result.blockers.map(b=>b.message).join('; ')}`);
 return {allowed:true,legacy:false,setupId:state.setupId,setupScope:result.snapshot.scope,storageProbeRequired:!result.scheduledOperationVerified};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),command=args.shift(),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
  const root=path.resolve(option('--root')||'.');
  assert(['init','inspect','save','guard'].includes(command),'Use setup-state.mjs init|inspect|save|guard [--root ROOT] [--input FILE --expected-revision HASH]');
  if(command==='guard')console.log(JSON.stringify(await setupGuard(root)));
  else{
   const result=command==='init'?await initializeSetup(root):command==='save'?await saveSetup(root,await read(option('--input')),option('--expected-revision')):await readSetup(root);
   console.log(JSON.stringify({...result,readiness:await inspectSetup(root,result.state)},null,2));
  }
 }catch(e){console.error(e.message);process.exitCode=2;}
}
