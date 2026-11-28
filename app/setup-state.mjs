// Private setup coordination. Facts stay in the profile/workbook; this file stores approvals and evidence references.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {withLock, writeJsonAtomic} from './store.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {setupSearchProgress} from './setup-progress.mjs';

export const TOPICS = {background:[1], roles:[2], seniority:[3], geography:[4], strengthsGaps:[5,6,7,9], calibration:[8], sources:[10], employers:[], personalSettings:[]};
const STATES = ['missing','draft','needs_answer','approved','needs_review'];
// Blockers are reported in prerequisite order, so `next` follows the setup sequence rather than file order.
const RANK = {setup_reset:0,capability:1,question:2,topic_review:2,profile:3,limitation:3,discovery:4,prompt:5,scope_review:6,final_approval:7};
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const digest = value => hash(JSON.stringify(value));
const read = async file => JSON.parse((await fs.readFile(file,'utf8')).replace(/^﻿/,''));
const optional = async file => {try{return await fs.readFile(file,'utf8');}catch(e){if(e.code==='ENOENT')return null;throw e;}};
const optionalJson = async file => {const raw=await optional(file);return raw===null?null:JSON.parse(raw.replace(/^﻿/,''));};
const instant = value => typeof value==='string' && /Z$/.test(value) && Number.isFinite(Date.parse(value));
const sha = value => typeof value==='string' && /^[a-f0-9]{64}$/.test(value);
const text = value => typeof value==='string' && !!value.trim();
const assert = (test,message) => {if(!test)throw Error(message);};
const record = value => value && typeof value==='object' && !Array.isArray(value);
const statePath = root => path.join(root,'data/reports/setup-state.json');
const canonical = text => text.replace(/\r\n/g,'\n').trim();
const byCompany = (a,b) => a.Company<b.Company?-1:a.Company>b.Company?1:0; // locale-independent: hashes must match on every host
export async function readSetupReset(root){
 const raw=await optional(path.join(root,'data/reports/setup-scope-reset.json'));
 if(raw===null)return null;
 const receipt=JSON.parse(raw.replace(/^﻿/,''));
 assert(receipt.schemaVersion===1 && sha(receipt.scope) && ['started','complete'].includes(receipt.status) && instant(receipt.startedAt) && record(receipt.previousCoverage),'Malformed or unsupported setup reset receipt; preserve it and recover explicitly');
 assert(receipt.status!=='complete' || instant(receipt.completedAt),'Completed setup reset lacks a valid completion time');
 assert(receipt.mode===undefined || ['all','employers'].includes(receipt.mode),'Invalid reset replay mode');
 assert(receipt.mode!=='employers' || Array.isArray(receipt.employers) && receipt.employers.every(name=>typeof name==='string' && name),'Invalid selective reset employer list');
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
 // Only these exact shipped guidance lines are exempt; quoted facts still require validation.
 const guidance=new Set(['> Replace every `{{…}}` and every line starting with "Example:". Delete examples you do not need.', '> Replace every `{{…}}` and every line starting with "Example:".']);
 const profileProblems=profile.split(/\r?\n/).flatMap((line,i)=>!guidance.has(line.trim()) && (/\{\{[^}]*\}\}/.test(line) || /^(?:\s*>)*\s*-?\s*Example:/.test(line))?[i+1]:[]);
 let employers=null;
 try{employers=(await employerWorkbook({file:path.join(root,'profile/companies.xlsx')})).employers
  .map(({row,...values})=>Object.fromEntries(Object.entries(values).filter(([key])=>!['#','Last checked','Careers page'].includes(key))))
  .sort(byCompany);}catch(e){if(e.code!=='ENOENT')throw e;}
 const fingerprints={};
 for(const [topic,ids] of Object.entries(TOPICS)){
  const value=topic==='employers'?employers:topic==='personalSettings'?(filled?canonical(filled.split('## Part B')[0]):null):ids.map(id=>sections[id]||null);
  fingerprints[topic]=value && (ids.length?value.every(Boolean):topic==='employers'?value.length>0:true)?digest(value):null;
 }
 // Only settings that change what is captured: the alert label and the look-back. Timezone/language do not.
 const searchSettings=canonical(filled.split('## Part B')[0]).split('\n').filter(line=>/Gmail label with job alerts:|First search goes back:/.test(line));
 // The template's Name field is descriptive. Keep every other background line (including unknown prose)
 // as a dependency so authorization, experience, location and language edits cannot silently evade review.
 const backgroundInputs=sections[1]?canonical(sections[1].split('\n').filter(line=>!/^\s*(?:[-*]\s+)?Name\s*:/i.test(line)).join('\n')):null;
 // Calibration rates against every fact and rule. Employer/source suitability depends on eligibility and
 // listing exclusions (§7/§9), not on strengths or gaps, which affect ratings only.
 const assessmentBasis=digest({backgroundInputs,topics:['roles','seniority','geography','strengthsGaps'].map(id=>fingerprints[id])});
 const suitabilityBasis=digest({backgroundInputs,topics:['roles','seniority','geography'].map(id=>fingerprints[id]),rules:[sections[7]||null,sections[9]||null]});
 // Listing readers filter before returning finds; relaxing §7/§9 must revisit uncaptured openings.
 const scopeParts={search:digest({backgroundInputs,topics:['roles','seniority','geography','sources'].map(id=>fingerprints[id]),rules:[sections[7]||null,sections[9]||null],searchSettings}),employers:Object.fromEntries((employers||[]).map(e=>[e.Company,digest(e)]))};
 return {fingerprints,scope:digest(scopeParts),scopeParts,assessmentBasis,suitabilityBasis,promptValid,profileValid:!!profile && !profileProblems.length,profileProblems,sectionIds:Object.keys(sections).map(Number),linkedinDirectDisabled:/LinkedIn direct reading:\s*disabled/i.test(sections[10]||''),promptFingerprint:filled?hash(filled):null,root:await fs.realpath(root)};
}
export function validateSetup(state){
 assert(record(state) && state.schemaVersion===1,'Unsupported or malformed setup state; preserve it and recover explicitly');
 const allowed=['schemaVersion','setupId','updatedAt','phase','topics','questions','capabilities','limitations','discoveryRuns','task','scopeReview','finalApproval','verification','quiescence','lastActiveScope','lastActiveScopeParts'];
 assert(Object.keys(state).every(key=>allowed.includes(key)),'Unknown setup field; keep personal facts in authoritative artifacts');
 assert(typeof state.setupId==='string' && state.setupId && instant(state.updatedAt),'Invalid setup identity/time');
 assert(['editing','active'].includes(state.phase),'Invalid setup phase');
 assert(record(state.topics) && Object.keys(state.topics).length===Object.keys(TOPICS).length,'Invalid topics');
 for(const id of Object.keys(TOPICS)){
  const t=state.topics[id];assert(record(t) && STATES.includes(t.status),`Invalid topic ${id}`);
  if(t.status==='approved')assert(t.approval?.by==='user' && instant(t.approval.at) && text(t.approval.evidence) && sha(t.approval.fingerprint),`Approval evidence missing for ${id}`);
  assert(t.basis===undefined || sha(t.basis),`Invalid basis for ${id}: save the readiness value, not a description`);
 }
 assert(Array.isArray(state.questions) && new Set(state.questions.map(q=>q?.id)).size===state.questions.length,'Invalid/duplicate pending questions');
 for(const q of state.questions)assert(record(q) && text(q.id) && typeof q.question==='string' && Array.isArray(q.topics) && q.topics.length && q.topics.every(id=>id in TOPICS) && ['unknown','declined','not_applicable'].includes(q.answer) && typeof q.blocking==='boolean','Invalid pending question');
 assert(record(state.capabilities) && Array.isArray(state.limitations) && Array.isArray(state.discoveryRuns),'Invalid evidence collections');
 for(const c of Object.values(state.capabilities))assert(record(c) && ['untested','verified','failed','unavailable'].includes(c.status) && ['interactive','scheduled'].includes(c.context) && instant(c.observedAt) && typeof c.ref==='string','Invalid capability');
 for(const l of state.limitations)assert(record(l) && text(l.consequence) && /^§\d+$/.test(l.profileRef) && l.acceptedBy==='user' && instant(l.acceptedAt),'Limitations need explicit acceptance and a profile section reference such as §10');
 for(const id of state.discoveryRuns)assert(typeof id==='string' && /^[\w.-]+$/.test(id),'discoveryRuns lists run folder names');
 const optionalShape=(key,test)=>assert(state[key]===undefined || (record(state[key]) && test(state[key])),`Invalid ${key}`);
 optionalShape('task',t=>text(t.id) && ['claude','codex'].includes(t.platform) && text(t.root) && text(t.schedule) && (t.promptEvidence===undefined || text(t.promptEvidence)));
 optionalShape('scopeReview',s=>sha(s.fingerprint) && text(s.evidence));
 optionalShape('finalApproval',f=>f.by==='user' && instant(f.at) && sha(f.fingerprint));
 optionalShape('verification',v=>sha(v.operation) && ['interactive','scheduled'].includes(v.context) && text(v.runId) && typeof v.gmail==='string' && text(v.importReport) && text(v.storageProbe));
 optionalShape('quiescence',q=>q.confirmedStopped===true && instant(q.at) && text(q.evidence));
 assert(state.lastActiveScope===undefined || sha(state.lastActiveScope),'Invalid lastActiveScope');
 optionalShape('lastActiveScopeParts',p=>sha(p.search) && record(p.employers));
 return state;
}
export async function readSetup(root){
 const raw=await optional(statePath(root));
 return {state:raw===null?null:validateSetup(JSON.parse(raw.replace(/^﻿/,''))),revision:raw===null?'missing':hash(raw)};
}
export async function inspectSetup(root,state,{progress=true}={}){
 const snapshot=await setupSnapshot(root);
 const reset=await resetReadiness(root),blockers=[],order=Object.keys(TOPICS);
 const block=(code,message,topic,offset=0)=>blockers.push({code,message,...(topic?{topic}:{}),rank:RANK[code]+(topic?(order.indexOf(topic)+offset)/100:0)});
 const finish=()=>{blockers.sort((a,b)=>a.rank-b.rank);for(const b of blockers)delete b.rank;};
 if(reset.blocker)block('setup_reset',reset.blocker);
 if(!state){finish();return {snapshot,blockers,topics:Object.fromEntries(Object.keys(TOPICS).map(id=>[id,'missing'])),personalizationReady:false,scheduledOperationVerified:false,initialSearch:'not_started',next:reset.blocker||'Reconcile existing artifacts and initialize setup; no approvals inferred'};}
 validateSetup(state);
 const topics={},topicBlockers={};
 for(const id of Object.keys(TOPICS)){
  const t=state.topics[id];topics[id]=t.status==='approved' && t.approval.fingerprint!==snapshot.fingerprints[id]?'needs_review':t.status;
  topicBlockers[id]=topics[id]==='approved'?[]:[topics[id]==='needs_review' && t.status==='approved'?'Approved content differs from the current artifact':`Topic is ${topics[id]}`];
 }
 // Calibration depends on the facts/rules used to rate examples; employers/sources on eligibility and exclusions.
 const calibrationBasis=snapshot.assessmentBasis,suitabilityBasis=snapshot.suitabilityBasis;
 for(const id of ['calibration','sources','employers']){
  const expected=id==='calibration'?calibrationBasis:suitabilityBasis;
  if(state.topics[id].status!=='approved' || state.topics[id].basis===expected)continue;
  topics[id]='needs_review';
  const label=id==='calibration'?'Calibration':id==='sources'?'Source suitability':'Employer suitability';
  const field=id==='calibration'?'calibrationBasis':'suitabilityBasis';
  topicBlockers[id].push(state.topics[id].basis?`${label} approval predates the current ${id==='calibration'?'assessment':'eligibility'} inputs; review and save basis: readiness.${field}`:`${label} approval is missing dependency evidence; save basis: readiness.${field} after review`);
 }
 for(const [id,reasons] of Object.entries(topicBlockers))for(const message of reasons)block('topic_review',message,id,0.5);
 const gmail=state.capabilities.gmail;
 if(gmail?.status!=='verified')block('capability',gmail?`Required Gmail access is ${gmail.status}; resolve it before activation (capabilities.gmail)`:'Check Gmail access early and record capabilities.gmail; it is required for this routine');
 for(const l of state.limitations)if(!snapshot.sectionIds.includes(Number(l.profileRef.slice(1))))block('limitation',`Accepted limitation refers to missing profile section ${l.profileRef}`);
 if(snapshot.linkedinDirectDisabled && !state.limitations.some(l=>l.profileRef==='§10'))block('limitation','Profile §10 disables direct LinkedIn reading without a recorded user acceptance (limitations entry with profileRef §10)');
 for(const runId of state.discoveryRuns){
  let manifest=null;try{manifest=await optionalJson(path.join(root,'data/reports/runs',runId,'run-completion.json'));}catch{}
  if(!(manifest?.runId===runId && manifest.setupDiscovery===true && manifest.setupId===state.setupId))block('discovery',`Setup discovery run ${runId} needs run-completion.json with its runId, setupId and setupDiscovery: true so the routine takes it over instead of continuing it`);
 }
 // Mounted scheduled environments may expose ROOT under another path; installation identity must survive that mapping.
 const task=state.task?{id:state.task.id,platform:state.task.platform,schedule:state.task.schedule,root:state.task.root}:null;
 const configuration=digest({topics:snapshot.fingerprints,prompt:snapshot.promptFingerprint,installation:state.setupId,task});
 // Scheduled operation depends on what runs (installed text, task, installation), not on profile wording.
 const operation=digest({prompt:snapshot.promptFingerprint,installation:state.setupId,task});
 let scopeReviewed=state.scopeReview?.fingerprint===snapshot.scope;
 // Legacy coverage may describe a narrower search. A scope change needs a completed replay reset, not a status flag.
 const priorCoverage=await optional(path.join(root,'data/reports/coverage.json'));
 if(scopeReviewed && priorCoverage!==null && state.lastActiveScope!==snapshot.scope){
  scopeReviewed=reset.receipt?.status==='complete' && reset.receipt.scope===snapshot.scope;
 }
 if(!snapshot.profileValid)block('profile',snapshot.profileProblems.length?`Profile has unresolved placeholders or Example lines at line ${snapshot.profileProblems.join(', ')}`:'Profile is missing');
 if(!snapshot.promptValid)block('prompt','Filled prompt is missing, has placeholders or differs from current Part B');
 if(!scopeReviewed)block('scope_review','Scope review or completed replay evidence is missing/stale');
 for(const question of state.questions)if(question.blocking && question.answer!=='not_applicable')block('question',`Blocking decision ${question.id} is ${question.answer}`,question.topics[0]);
 if(!(state.finalApproval?.by==='user' && state.finalApproval?.fingerprint===configuration && instant(state.finalApproval.at)))block('final_approval','Final assembled configuration approval is missing/stale');
 finish();
 // Gmail feasibility gates activation, not personalization: the two outcomes are reported separately.
 const personalizationReady=blockers.every(b=>b.code==='capability');
 const activationReady=blockers.length===0;
 let scheduledOperationVerified=false, verificationError=null;
 try{
  const v=state.verification;
  if(v){
   assert(v.operation===operation && v.context==='scheduled','Verification operation/context is stale');
   assert(task,'Missing installed task identity/schedule/ROOT');
   assert(hash(await fs.readFile(await reference(root,state.task.promptEvidence),'utf8'))===snapshot.promptFingerprint,'Installed prompt differs');
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
 const searchProgress=progress?await setupSearchProgress(root,state,snapshot,reset):null;
 return {snapshot,calibrationBasis,suitabilityBasis,configuration,operation,topics,topicBlockers,blockers,scopeReviewed,personalizationReady,activationReady,scheduledOperationVerified,initialSearch:searchProgress?.status??null,searchProgress,verificationError,next:blockers.length?blockers[0].message:state.phase!=='active'?'Activate after confirming schedules are safe':!scheduledOperationVerified?'Verify actual scheduled execution':'Report readiness and remaining search work separately'};
}
export async function saveSetup(root,proposed,expectedRevision){
 const folder=path.dirname(statePath(root));await fs.mkdir(folder,{recursive:true});
 return withLock(folder,async()=>{
  const current=await readSetup(root);assert(current.revision===expectedRevision,'Setup changed; reread before saving');
  const next=structuredClone(proposed);next.updatedAt=new Date().toISOString();validateSetup(next);
  assert(!current.state || current.state.setupId===next.setupId,'Cannot replace setup identity');
  assert(next.lastActiveScope===current.state?.lastActiveScope && JSON.stringify(next.lastActiveScopeParts)===JSON.stringify(current.state?.lastActiveScopeParts),'Only activation may set the active scope');
  if(current.state?.phase==='active' && next.phase==='editing'){
   // A confirmation saved before the last state write (for example the previous editing session's) proves nothing now.
   const q=next.quiescence,at=Date.parse(q?.at);
   assert(q?.confirmedStopped===true && at>=Date.parse(current.state.updatedAt) && at<=Date.now()+300000,'Confirm existing schedules paused and active runs stopped before editing; the confirmation must be newer than the last saved setup state');
  }
  if(next.phase==='active'){
   const readiness=await inspectSetup(root,next,{progress:false});
   assert(readiness.activationReady,`Cannot activate incomplete/unapproved configuration: ${readiness.blockers.map(b=>b.message).join('; ')}`);
   if(current.state?.phase!=='active'){
    const {scope,scopeParts}=await setupSnapshot(root);
    next.lastActiveScope=scope;next.lastActiveScopeParts=scopeParts;delete next.quiescence;
   }
  }
  if(current.state){
   const backups=path.join(folder,'setup-backups');
   await writeJsonAtomic(path.join(backups,`${Date.now()}-${crypto.randomUUID()}.json`),current.state);
   // shortcut: keeps the newest 50 previous states; raise if longer attended reviews need more history.
   for(const name of (await fs.readdir(backups)).filter(n=>/^\d+-[0-9a-f-]{36}\.json$/.test(n)).sort().slice(0,-50))await fs.rm(path.join(backups,name),{force:true});
  }
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
 const result=await inspectSetup(root,state,{progress:false});
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
