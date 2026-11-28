// M7 recovery outcome tests. Assertions are about outcomes (initial-search status, the work a next run owes, the
// checkpoints a routine would treat as due) and never about a recovery file format, so the same scenarios can be run
// against a pinned reference implementation through another adapter. Fictional data in OS temporary storage only.
//   node app/test-recovery-outcomes.mjs   (this checkout's design; every MUST and SHOULD must pass)
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const retryKeys=retry=>retry.map(item=>item.match(/^(employer|portal) (.+?): /)).filter(Boolean).map(m=>`${m[1]}|${m[2]}`);
const today=()=>new Date().toISOString().slice(0,10);
let last=0;
const now=()=>{while(Date.now()<=last){}last=Date.now();return new Date(last).toISOString();};

async function world(lib,ops){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'recovery-outcomes-')),data=path.join(root,'data');
 const file=rel=>path.join(root,rel);
 const put=async(rel,value)=>{await fs.mkdir(path.dirname(file(rel)),{recursive:true});await fs.writeFile(file(rel),typeof value==='string'?value:JSON.stringify(value));};
 const json=async rel=>JSON.parse(await fs.readFile(file(rel),'utf8'));
 const exists=rel=>fs.access(file(rel)).then(()=>true,()=>false);
 await put('data/jobs.json',{schemaVersion:1,jobs:[]});
 await put('data/reports/coverage.json',{unfinished:[],gmailCheckedThrough:'2026-11-01T00:00:00.000Z',employers:{Keep:{lastChecked:'2026-11-01'},Changed:{lastChecked:'2026-11-01'}},sources:{Portal:{lastSuccessfulCheckedThrough:'2026-11-01T00:00:00.000Z',progress:{}}},dropped:[]});
 await put('profile/candidate_profile.md',Array.from({length:10},(_,i)=>`## ${i+1}. Topic\n${i===0?'- Name: Fictional\n- Work authorization: Austria':'Fictional content '+(i+1)}\n`).join('\n'));
 await put('agent/ROUTINE_PROMPT.md','## Part A\nCandidate: Fictional\n## Part B\nFixed\n');await put('agent/ROUTINE_PROMPT.filled.md','## Part A\nCandidate: Fictional\n## Part B\nFixed\n');
 const workbook=file('profile/companies.xlsx');
 await fs.copyFile(new URL('../templates/profile/companies.xlsx',lib.base),workbook);
 await lib.employerWorkbook({file:workbook,action:'replace',records:[{Company:'Keep',Priority:'A'},{Company:'Changed',Priority:'B'}]});
 const {state}=await lib.initializeSetup(root);
 const activate=async()=>{const s=await lib.setupSnapshot(root);state.lastActiveScope=s.scope;state.lastActiveScopeParts=s.scopeParts;await put('data/reports/setup-state.json',state);};
 await activate();
 let seq=0;const runDir=id=>`data/reports/runs/${id}`;
 const coverage=async change=>{const c=await json('data/reports/coverage.json');change(c);await put('data/reports/coverage.json',c);};
 const w={root,data,put,json,exists,runDir,attended:0,must:[],should:[],
  expect(kind,ok,message){w[kind].push({ok:!!ok,message});},
  async run(name,{tagged=true,id=`run-${1000+ ++seq}-${name}`}={}){
   const scope=(await lib.setupSnapshot(root)).scope;
   await put(`${runDir(id)}/run-completion.json`,{runId:id,startedAt:now(),status:'started',profile:lib.profileHash(data),...(tagged?{setupId:state.setupId,setupScope:scope}:{})});
   await put(`${runDir(id)}/run-ledger.jsonl`,'');await put(`${runDir(id)}/source-evidence.jsonl`,'');return id;
  },
  folder:async(name,files)=>{const id=`run-${1000+ ++seq}-${name}`;for(const [rel,value] of Object.entries(files))await put(`${runDir(id)}/${rel}`,value);return id;},
  select:(id,sources)=>ops.select(w,id,{employer:[],portal:[],...sources}),
  async evidence(id,kind,source,status,error=status==='checked'?'':'Fixture tool error'){
   await fs.appendFile(file(`${runDir(id)}/source-evidence.jsonl`),JSON.stringify({kind,source,status,at:now(),error})+'\n');
  },
  async checkpoint({employer,portal,gmail},store='both'){
   if(employer && store!=='coverage')await lib.employerWorkbook({file:workbook,action:'update',records:[{Company:employer,'Last checked':today()}]});
   await coverage(c=>{
    if(employer && store!=='workbook')(c.employers[employer]||={}).lastChecked=today();
    if(portal)(c.sources[portal]||={progress:{}}).lastSuccessfulCheckedThrough=now();
    if(gmail)c.gmailCheckedThrough=now();
   });
  },
  async check(id,kind,source){await w.evidence(id,kind,source,'checked');await w.checkpoint({[kind]:source});},
  async finish(id){
   await w.select(id,{});lib.finishRun(data,id); // the routine always writes due.json, empty when nothing is due
   const manifest=await json(`${runDir(id)}/run-completion.json`);await put(`${runDir(id)}/run-completion.json`,{...manifest,status:'finished'});
   await ops.afterFinish?.(w,id);
  },
  capture:(id,find)=>fs.appendFile(file(`${runDir(id)}/run-ledger.jsonl`),JSON.stringify({...find,state:'excluded',reason:'Fixture exclusion'})+'\n'),
  takeOver:(orphan,target)=>ops.takeOver(w,orphan,target),
  async employers(action,records){const wb=await lib.employerWorkbook({file:workbook});await lib.employerWorkbook({file:workbook,action,expectedRevision:wb.revision,records});},
  async reset(options={}){const receipt=await lib.resetSetupScope(root,{confirmedStopped:true,...options});if(receipt.status==='complete')await activate();return receipt;},
  progress:async()=>(await lib.inspectSetup(root,state)).searchProgress,
  status:async()=>(await w.progress()).status,
  owed:async()=>new Set(await ops.owed(w,lib)),
  async pending(){
   // What the next run must check: owed work plus sources whose successful checkpoint is missing (routine due rules).
   const out=await w.owed(),c=await json('data/reports/coverage.json');
   for(const e of (await lib.employerWorkbook({file:workbook})).employers)if(!e['Last checked'] && !c.employers?.[e.Company]?.lastChecked)out.add(`employer|${e.Company}`);
   for(const [name,s] of Object.entries(c.sources||{}))if(!s.lastSuccessfulCheckedThrough)out.add(`portal|${name}`);
   return out;
  },
  keys:set=>[...set].sort().join(', ')||'none',
  cleanup:()=>fs.rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100}),
 };
 w.retryKeys=retryKeys;w.lib=lib;w.ops=ops;
 return w;
}

const find={company:'Fictional Employer',title:'Fictional Analyst',location:'Vienna',url:'https://example.org/jobs/orphan-1'};
export const scenarios=[
 ['Fresh setup without runs is not started and owes nothing',async w=>{
  w.expect('must',await w.status()==='not_started','status not_started');w.expect('must',!(await w.owed()).size,'nothing owed');
 }],
 ['Ordinarily due A interrupted, then B added: both stay due until checked',async w=>{
  const r1=await w.run('a');await w.select(r1,{employer:['Keep']});
  await w.employers('upsert',[{Company:'Added',Priority:'C'}]);await w.reset();
  const owed=await w.owed(),pending=await w.pending();
  w.expect('must',owed.has('employer|Keep'),`interrupted selection Keep owed (owed: ${w.keys(owed)})`);
  w.expect('must',pending.has('employer|Added'),'added employer due');
  w.expect('must',await w.status()!=='complete','not complete');
  const r2=await w.run('b');await w.select(r2,{employer:['Keep','Added']});await w.check(r2,'employer','Keep');await w.check(r2,'employer','Added');await w.finish(r2);
  w.expect('must',await w.status()==='complete','complete after both checked');w.expect('must',!(await w.owed()).size,'nothing owed after');
 }],
 ['Forced not-yet-due retry interrupted before its attempt stays owed',async w=>{
  const r1=await w.run('a');await w.select(r1,{portal:['Portal']});await w.evidence(r1,'portal','Portal','failed');await w.finish(r1);
  w.expect('must',(await w.owed()).has('portal|Portal'),'failed portal owed');
  const r2=await w.run('b');await w.select(r2,{portal:['Portal']});
  w.expect('must',(await w.owed()).has('portal|Portal'),'still owed after interruption before attempt');
  w.expect('must',await w.status()!=='complete','not complete');
  const r3=await w.run('c');await w.select(r3,{portal:['Portal']});await w.check(r3,'portal','Portal');await w.finish(r3);
  w.expect('must',await w.status()==='complete','complete after success');w.expect('must',!(await w.owed()).size,'success clears retry');
 }],
 ['Failure without an error, then interruption before finish, stays owed',async w=>{
  const r1=await w.run('a');await w.select(r1,{portal:['Portal']});await w.evidence(r1,'portal','Portal','partial','');
  w.expect('must',(await w.owed()).has('portal|Portal'),'unfinished partial owed');w.expect('must',await w.status()!=='complete','not complete');
  const r2=await w.run('b');await w.select(r2,{portal:['Portal']});await w.check(r2,'portal','Portal');await w.finish(r2);
  w.expect('must',await w.status()==='complete','complete after recovery');
 }],
 ['Same-day resume finishes the interrupted run',async w=>{
  const r1=await w.run('a');await w.select(r1,{portal:['Portal']});
  w.expect('must',await w.status()!=='complete','interrupted run not complete');
  await w.check(r1,'portal','Portal');await w.finish(r1);
  w.expect('must',await w.status()==='complete','complete after resume');w.expect('must',!(await w.owed()).size,'nothing owed');
 }],
 ['Within one resumed run: earlier success then selection, and success then later failure',async w=>{
  const r1=await w.run('a');await w.check(r1,'portal','Portal');await w.select(r1,{portal:['Portal']});await w.finish(r1);
  w.expect('should',await w.status()==='complete' && !(await w.owed()).size,'an obligation from before the run is met by a check in that run');
  const r2=await w.run('b');await w.select(r2,{portal:['Portal']});await w.evidence(r2,'portal','Portal','checked');await w.evidence(r2,'portal','Portal','failed');await w.finish(r2);
  w.expect('must',(await w.owed()).has('portal|Portal'),'a later failure in the same second wins');w.expect('must',await w.status()!=='complete','not complete');
 }],
 ['Two selective resets keep unrelated pending work and replay only changed employers',async w=>{
  const r1=await w.run('a');await w.select(r1,{employer:['Keep'],portal:['Portal']});await w.check(r1,'portal','Portal');
  await w.employers('upsert',[{Company:'Changed',Focus:'Edited'}]);await w.reset();
  let owed=await w.owed();
  w.expect('must',owed.has('employer|Keep'),`unchanged Keep owed after first reset (owed: ${w.keys(owed)})`);
  w.expect('must',(await w.pending()).has('employer|Changed'),'changed employer due');
  w.expect('should',!owed.has('portal|Portal'),'portal checked before the reset is not owed again');
  const r2=await w.run('b');await w.select(r2,{employer:['Keep','Changed']});await w.check(r2,'employer','Changed');await w.evidence(r2,'employer','Keep','deferred','Per-run employer limit');await w.finish(r2);
  owed=await w.owed();w.expect('must',owed.has('employer|Keep'),'deferred Keep owed');w.expect('must',!owed.has('employer|Changed'),'checked Changed not owed');
  await w.employers('upsert',[{Company:'Third',Priority:'C'}]);await w.reset();
  w.expect('must',(await w.owed()).has('employer|Keep'),'Keep still owed after second reset');w.expect('must',(await w.pending()).has('employer|Third'),'Third due');
  w.expect('must',await w.status()!=='complete','not complete');
  const r3=await w.run('c');await w.select(r3,{employer:['Keep','Third']});await w.check(r3,'employer','Keep');await w.check(r3,'employer','Third');await w.finish(r3);
  w.expect('must',await w.status()==='complete','complete');w.expect('must',!(await w.owed()).size,'nothing owed');
 }],
 ['An interrupted checkpoint reset prevents completion',async w=>{
  const r1=await w.run('a');await w.finish(r1);
  await w.employers('upsert',[{Company:'Changed',Focus:'Edited'}]);
  await w.reset({beforeCoverage:()=>{throw Error('Fixture interruption');}}).catch(()=>{});
  const p=await w.progress();
  w.expect('must',p.status!=='complete','not complete');w.expect('must',p.blockers.some(b=>/reset/i.test(b)),'reset named');
 }],
 ['Orphan with an uncaptured nested vacancy is complete only after capture and takeover',async w=>{
  const r1=await w.run('a');await w.finish(r1);
  w.expect('must',await w.status()==='complete','baseline complete');
  const orphan=await w.folder('orphan',{'run-ledger.jsonl':'','nested/reader-result.jsonl':JSON.stringify(find)+'\n'});
  w.expect('must',await w.status()!=='complete','orphan with results blocks completion');
  const r2=await w.run('b');await w.finish(r2);await w.takeOver(orphan,r2);
  w.expect('must',await w.status()!=='complete','takeover without capture is not complete');
  await w.capture(r2,find);await w.takeOver(orphan,r2);
  w.expect('must',await w.status()==='complete','complete after capture');
  const r3=await w.run('c');await w.finish(r3);
  w.expect('must',await w.status()==='complete','a later unrelated finished run keeps it complete');
  w.expect('must',(await fs.readFile(path.join(w.root,w.runDir(orphan),'nested/reader-result.jsonl'),'utf8')).includes(find.url),'orphan payload preserved');
  w.expect('should',w.attended===0,`no attended intervention (attended: ${w.attended})`);
 }],
 ['Empty orphan needs no intervention; an unfamiliar file does',async w=>{
  const r1=await w.run('a');await w.finish(r1);const empty=await w.folder('empty',{'run-ledger.jsonl':'','source-evidence.jsonl':'\n'});
  w.expect('should',await w.status()==='complete','provably empty folder does not block');
  await w.ops.acknowledgeEmpty?.(w,empty);w.expect('must',await w.status()==='complete','complete once empty is established');
  await w.folder('notes',{'run-ledger.jsonl':'','notes.txt':'unknown saved output'});
  w.expect('must',await w.status()!=='complete','unfamiliar content blocks completion');
 }],
 ['A removed source stops being owed after the next run',async w=>{
  const r1=await w.run('a');await w.select(r1,{employer:['Changed']});await w.evidence(r1,'employer','Changed','failed');await w.finish(r1);
  w.expect('must',(await w.owed()).has('employer|Changed'),'failed employer owed');
  await w.employers('replace',[{Company:'Keep',Priority:'A'}]);await w.reset();
  const r2=await w.run('b');await w.select(r2,{employer:[]});await w.finish(r2);
  w.expect('should',!(await w.owed()).has('employer|Changed'),'removed employer no longer owed');
  w.expect('should',await w.status()==='complete',`no permanent blocker (${(await w.progress()).blockers.join('; ')})`);
 }],
 ['A full replay is incomplete while the Gmail checkpoint is missing',async w=>{
  await w.reset({allSources:true});
  const r1=await w.run('a');await w.select(r1,{employer:['Keep','Changed'],portal:['Portal']});
  for(const name of ['Keep','Changed'])await w.check(r1,'employer',name);await w.check(r1,'portal','Portal');await w.finish(r1);
  w.expect('must',await w.status()!=='complete','missing Gmail checkpoint is not complete');
  await w.checkpoint({gmail:true});w.expect('must',await w.status()==='complete','complete after Gmail checkpoint');
 }],
 ['Never-selected employers and coverage-listed portals keep the initial search incomplete',async w=>{
  await w.reset({allSources:true});await w.checkpoint({gmail:true});
  const r1=await w.run('a');await w.select(r1,{employer:['Keep']});await w.check(r1,'employer','Keep');await w.finish(r1);
  w.expect('must',await w.status()!=='complete','unselected Changed and Portal block completion');
  const r2=await w.run('b');await w.select(r2,{employer:['Changed'],portal:['Portal']});await w.check(r2,'employer','Changed');await w.check(r2,'portal','Portal');await w.finish(r2);
  w.expect('must',await w.status()==='complete','complete after all sources');
 }],
 ['Interruptions around evidence and checkpoint saves keep work due',async w=>{
  await w.reset({allSources:true});await w.checkpoint({gmail:true});
  const r1=await w.run('a');await w.select(r1,{employer:['Keep','Changed'],portal:['Portal']});
  await w.evidence(r1,'employer','Keep','checked');await w.checkpoint({employer:'Keep'},'workbook');
  await w.evidence(r1,'employer','Changed','checked');await w.checkpoint({portal:'Portal'});
  const pending=await w.pending();
  w.expect('must',pending.has('employer|Changed'),'checked but unrecorded employer still due');
  w.expect('must',pending.has('portal|Portal'),`checkpoint without evidence still owed (pending: ${w.keys(pending)})`);
  w.expect('must',await w.status()!=='complete','not complete');
  w.expect('should',!pending.has('employer|Keep'),'workbook-only date counts');
  const r2=await w.run('b');await w.select(r2,{employer:['Changed'],portal:['Portal']});await w.check(r2,'employer','Changed');await w.check(r2,'portal','Portal');await w.finish(r2);
  w.expect('must',await w.status()==='complete','complete after recovery');
 }],
 // Regressions from Codex's 2026-11-28 review of the simplified design.
 ['A finished run that omits carried work keeps it owed',async w=>{
  const r1=await w.run('a');await w.select(r1,{portal:['Portal']});await w.evidence(r1,'portal','Portal','failed');await w.finish(r1);
  const r2=await w.run('b');await w.finish(r2);
  w.expect('must',(await w.owed()).has('portal|Portal'),'omitting the failed portal does not cancel it');w.expect('must',await w.status()!=='complete','not complete');
  const r3=await w.run('c');await w.select(r3,{portal:['Portal']});await w.check(r3,'portal','Portal');await w.finish(r3);
  w.expect('must',await w.status()==='complete' && !(await w.owed()).size,'complete after a successful retry');
 }],
 ['An earlier success does not satisfy a later unattempted selection',async w=>{
  const r1=await w.run('a');await w.select(r1,{portal:['Portal']});await w.evidence(r1,'portal','Portal','checked');
  const r2=await w.run('b');await w.select(r2,{portal:['Portal']});
  w.expect('must',(await w.owed()).has('portal|Portal'),'the later selection is owed');
 }],
 ['Same-minute runs are ordered by start time, not by random suffix',async w=>{
  const r1=await w.run('a',{id:'run-202611280900-zzzz'});await w.finish(r1);
  const r2=await w.run('b',{id:'run-202611280900-aaaa'});await w.select(r2,{portal:['Portal']});await w.evidence(r2,'portal','Portal','failed');
  w.expect('must',(await w.owed()).has('portal|Portal'),'the later interrupted run is not hidden by an earlier finished one');
  w.expect('must',await w.status()!=='complete','not complete');
 }],
 ['An uncaptured vacancy in a JSON result file blocks completion after takeover',async w=>{
  const r1=await w.run('a');await w.finish(r1);
  const orphan=await w.folder('orphan',{'results.json':JSON.stringify([find])});
  const r2=await w.run('b');await w.finish(r2);await w.takeOver(orphan,r2);
  w.expect('must',await w.status()!=='complete','uncaptured JSON find blocks');
  await w.capture(r2,find);await w.takeOver(orphan,r2);w.expect('must',await w.status()==='complete','complete after capture');
 }],
 ['An empty finish record is not evidence of completion',async w=>{
  const r1=await w.run('a');await w.finish(r1);await w.put(`${w.runDir(r1)}/finish.json`,{});
  w.expect('must',await w.status()!=='complete','{} finish.json is not complete');
 }],
 ['A finished untagged legacy run keeps its open find and due source visible',async w=>{
  const r1=await w.run('legacy',{tagged:false});await w.select(r1,{portal:['Portal']});await w.evidence(r1,'portal','Portal','failed');
  await fs.appendFile(path.join(w.root,w.runDir(r1),'run-ledger.jsonl'),JSON.stringify({...find,state:'pending'})+'\n');await w.finish(r1);
  const r2=await w.run('b');await w.finish(r2);
  w.expect('must',(await w.owed()).has('portal|Portal'),'legacy failed portal owed');w.expect('must',await w.status()!=='complete','open legacy find blocks');
 }],
 ['Resets drop only the carried work they replay',async w=>{
  const r1=await w.run('a');await w.select(r1,{employer:['Changed'],portal:['Portal']});
  await w.evidence(r1,'employer','Changed','failed');await w.evidence(r1,'portal','Portal','failed');await w.finish(r1);
  await w.employers('upsert',[{Company:'Changed',Focus:'Edited'}]);await w.reset();
  let owed=await w.owed();
  w.expect('must',owed.has('portal|Portal'),'an employer-only reset keeps carried portal work');
  w.expect('must',(await w.pending()).has('employer|Changed'),'the replayed employer is due');
  w.expect('should',!owed.has('employer|Changed'),'the replayed employer is not also carried');
  await w.reset({allSources:true});owed=await w.owed();
  w.expect('must',(await w.pending()).has('portal|Portal'),'a full replay makes the portal due');
  w.expect('should',!owed.size,`a full replay leaves nothing carried (owed: ${w.keys(owed)})`);
 }],
];

// Files written by the retired helpers (reference 4931d22) keep their meaning in existing installations.
export const compatibility=[
 ['Files from the retired selection journal and orphan classifier stay readable',async w=>{
  const r1=await w.run('a');
  await w.put(`${w.runDir(r1)}/due-selection.json`,{schemaVersion:1,runId:r1,sources:[{kind:'portal',source:'Portal',selectedAt:now(),selectionId:'fixture'}]});
  w.expect('must',(await w.owed()).has('portal|Portal'),'a journalled selection without due.json is owed');
  const r2=await w.run('b');await w.select(r2,{portal:['Portal']});await w.check(r2,'portal','Portal');await w.finish(r2);
  await w.folder('orphan',{'results.jsonl':JSON.stringify(find)+'\n','setup-recovery.json':JSON.stringify({schemaVersion:1,kind:'handover',targetRun:r2,evidence:'Fixture'})});
  w.expect('must',await w.status()!=='complete','a handover receipt still requires its finds in a ledger');
  await w.capture(r2,find);w.expect('must',await w.status()==='complete','a handover receipt counts as a takeover');
 }],
 ['A legacy empty receipt does not hide content added later',async w=>{
  const r1=await w.run('a');await w.finish(r1);
  const folder=await w.folder('empty',{'run-ledger.jsonl':'','setup-recovery.json':JSON.stringify({schemaVersion:1,kind:'empty',evidence:'Fixture'})});
  w.expect('must',await w.status()==='complete','a still-empty folder passes');
  await w.put(`${w.runDir(folder)}/notes.txt`,'unknown saved output');w.expect('must',await w.status()!=='complete','new content blocks');
 }],
 ['Unknown files in a taken-over run need review',async w=>{
  const r1=await w.run('a');await w.finish(r1);
  const orphan=await w.folder('orphan',{'notes.txt':'unknown saved output','helper.mjs':'console.log(1)'});
  const r2=await w.run('b');await w.finish(r2);
  w.expect('must',await w.status()!=='complete','unreviewed notes block; helper scripts do not');
  const m=await w.json(`${w.runDir(r2)}/run-completion.json`);await w.put(`${w.runDir(r2)}/run-completion.json`,{...m,reviewed:[`${orphan}/notes.txt`]});
  w.expect('must',await w.status()==='complete','complete once reviewed');
 }],
];

export async function runScenarios(lib,ops,list=scenarios){
 const results=[];
 for(const [name,fn] of list){
  const w=await world(lib,ops);
  try{await fn(w);}catch(error){w.expect('must',false,`threw: ${error.message}`);}
  const p=await w.progress().catch(()=>({blockers:[]}));
  results.push({name,must:w.must,should:w.should,attended:w.attended,blockers:p.blockers||[]});
  await w.cleanup();
 }
 return results;
}

export function report(results){
 let failed=0,soft=0;
 for(const r of results){
  const bad=r.must.filter(c=>!c.ok),weak=r.should.filter(c=>!c.ok);failed+=bad.length;soft+=weak.length;
  console.log(`${bad.length?'FAIL':weak.length?'WEAK':'PASS'} ${r.name} (attended ${r.attended}, final blockers ${r.blockers.length})`);
  for(const c of bad)console.log(`  MUST ${c.message}`);for(const c of weak)console.log(`  SHOULD ${c.message}`);
 }
 console.log(`recovery outcomes: ${results.length} scenarios, ${failed} MUST and ${soft} SHOULD failures`);
 return {failed,soft};
}

export async function loadLib(base){
 const load=name=>import(new URL(name,base));
 const [state,reset,wb,cc,finish]=await Promise.all(['setup-state.mjs','setup-reset.mjs','employer-workbook.mjs','capture-check.mjs','finish-run.mjs'].map(load));
 return {base,...state,...reset,...wb,profileHash:cc.profileHash,finishRun:finish.finishRun,previousRetry:finish.previousRetry};
}

// This checkout's design: due.json is the selection, finish/retry plus unfinished runs carry obligations, and the
// routine marks each earlier unfinished run it has taken over.
export const currentOps={
 async select(w,id,sources){
  const file=`${w.runDir(id)}/due.json`,old=await w.exists(file)?await w.json(file):{employer:[],portal:[]};
  await w.put(file,Object.fromEntries(['employer','portal'].map(k=>[k,[...new Set([...old[k],...sources[k]])]])));
 },
 owed:(w,lib)=>w.retryKeys(lib.previousRetry(w.data,'run-9999').retry),
 async takeOver(w,orphan,target){
  const file=`${w.runDir(orphan)}/run-completion.json`,old=await w.exists(file)?await w.json(file):{runId:orphan};
  await w.put(file,{...old,status:'finished',takenOverBy:target});
 },
 async afterFinish(w,id){
  for(const name of await fs.readdir(path.join(w.root,'data/reports/runs')))if(name<id){
   const file=`${w.runDir(name)}/run-completion.json`,manifest=await w.exists(file)?await w.json(file):null;
   if(manifest?.status!=='finished')await currentOps.takeOver(w,name,id);
  }
 },
};

if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {failed,soft}=report(await (async()=>{const lib=await loadLib(pathToFileURL(path.dirname(fileURLToPath(import.meta.url))+'/'));return runScenarios(lib,currentOps,[...scenarios,...compatibility]);})());
 if(failed||soft)process.exitCode=1;
}
