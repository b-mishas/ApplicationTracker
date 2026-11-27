import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {initializeSetup,inspectSetup,setupSnapshot} from './setup-state.mjs';
import {selectSources,classifyOrphan} from './setup-progress.mjs';
import {resetSetupScope} from './setup-reset.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {profileHash} from './capture-check.mjs';
import {finishRun} from './finish-run.mjs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
let count=0;
async function fixture(fn){
 const root=await fs.mkdtemp(path.join(os.tmpdir(),'setup-obligations-'));
 const put=async(rel,value)=>{const file=path.join(root,rel);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,typeof value==='string'?value:JSON.stringify(value));};
 try{
  await put('data/jobs.json',{schemaVersion:1,jobs:[]});await put('data/reports/coverage.json',{unfinished:[],gmailCheckedThrough:'2026-11-01T00:00:00Z',employers:{Keep:{lastChecked:'2026-11-01'},Changed:{lastChecked:'2026-11-01'}},sources:{Portal:{lastSuccessfulCheckedThrough:'2026-11-01T00:00:00Z',progress:{AT:{complete:true}}}}});
  const profile=Array.from({length:10},(_,i)=>`## ${i+1}. Topic\n${i===0?'- Name: Fictional\n- Work authorization: Austria':'Fictional content '+(i+1)}\n`).join('\n');
  await put('profile/candidate_profile.md',profile);await put('agent/ROUTINE_PROMPT.md','## Part A\nCandidate: Fictional\n## Part B\nFixed\n');await put('agent/ROUTINE_PROMPT.filled.md','## Part A\nCandidate: Fictional\n## Part B\nFixed\n');
  await fs.copyFile(new URL('../templates/profile/companies.xlsx',import.meta.url),path.join(root,'profile/companies.xlsx'));
  const workbook=path.join(root,'profile/companies.xlsx');await employerWorkbook({file:workbook,action:'replace',records:[{Company:'Keep',Priority:'A'},{Company:'Changed',Priority:'B'}]});
  const {state}=await initializeSetup(root);let snapshot=await setupSnapshot(root);
  state.lastActiveScope=snapshot.scope;state.lastActiveScopeParts=snapshot.scopeParts;
  await put('data/reports/setup-state.json',state);
  const at=ms=>new Date(ms).toISOString();
  const run=async(id,time,{scope=snapshot.scope,status='finished',due={employer:[],portal:[]},evidence=[],ledger=''}={})=>{
   await put(`data/reports/runs/${id}/run-completion.json`,{runId:id,setupId:state.setupId,setupScope:scope,startedAt:at(time),status,profile:profileHash(path.join(root,'data'))});
   await put(`data/reports/runs/${id}/due.json`,due);await put(`data/reports/runs/${id}/run-ledger.jsonl`,ledger);
   await put(`data/reports/runs/${id}/source-evidence.jsonl`,evidence.map(JSON.stringify).join('\n'));
   if(status==='finished')await put(`data/reports/runs/${id}/finish.json`,{runId:id,searchCoverage:'complete',retry:[]});
  };
  const outcome=(kind,source,time,status='checked')=>({kind,source,at:at(time),status,error:status==='checked'?'':'Fixture failure'});
  const progress=async()=>inspectSetup(root,state);
  await fn({root,put,state,snapshot,profile,workbook,run,at,outcome,progress});
 }finally{await fs.rm(root,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
}
const test=async(name,fn)=>{await fixture(fn);console.log(`PASS ${++count}: ${name}`);};

await test('A checked, B selected then interrupted, C omitted: only a post-selection check resolves B',async({put,run,outcome,progress})=>{
 const t=Date.now()-10000;
 await run('a',t,{due:{employer:[],portal:['Portal']},evidence:[outcome('portal','Portal',t)]});
 await run('b',t+1000,{status:'started',due:{employer:[],portal:['Portal']}});
 await run('c',t+2000);
 assert.equal((await progress()).initialSearch,'partial');
 assert((await progress()).searchProgress.blockers.some(b=>b.includes('after its selection')));
 await put('data/reports/runs/c/source-evidence.jsonl',JSON.stringify(outcome('portal','Portal',t+2000)));
 assert.equal((await progress()).initialSearch,'complete');
});

await test('Millisecond source evidence resolves a later same-second check without accepting earlier/coarse evidence',async({root,put,run,outcome,progress})=>{
 // Synthetic times reproduce the reviewed boundary; they are not observations of a live source.
 const second=Date.parse('2026-11-27T13:20:48.000Z');
 await run('precision',second,{due:{employer:[],portal:['Portal']}});
 const selectedAt=new Date(second+640).toISOString();
 await put('data/reports/runs/precision/due-selection.json',{schemaVersion:1,runId:'precision',sources:[{kind:'portal',source:'Portal',selectedAt,selectionId:'precision-fixture'}]});
 for(const elapsed of [0,100,639]){
  await put('data/reports/runs/precision/source-evidence.jsonl',JSON.stringify(outcome('portal','Portal',second+elapsed)));
  assert.equal((await progress()).initialSearch,'partial','A check before selection cannot satisfy it, even within the same second');
 }
 await put('data/reports/runs/precision/source-evidence.jsonl',JSON.stringify(outcome('portal','Portal',second+900)));
 assert.equal((await progress()).initialSearch,'complete','A later millisecond check within the same second satisfies selection');
 const saved=JSON.parse(await fs.readFile(path.join(root,'data/reports/runs/precision/due-selection.json'),'utf8'));assert.equal(saved.sources[0].selectedAt,selectedAt);
 // Legacy whole-second evidence is not invented precision: it counts only when its recorded instant is sufficient.
 await put('data/reports/runs/precision/source-evidence.jsonl',JSON.stringify({kind:'portal',source:'Portal',status:'checked',at:'2026-11-27T13:20:48Z'}));
 assert.equal((await progress()).initialSearch,'partial');
 await put('data/reports/runs/precision/source-evidence.jsonl',JSON.stringify({kind:'portal',source:'Portal',status:'checked',at:'2026-11-27T13:20:49Z'}));
 assert.equal((await progress()).initialSearch,'complete');
 const clock=spawnSync(process.execPath,['-p','new Date().toISOString()'],{encoding:'utf8'});
 assert.equal(clock.status,0,clock.stderr);assert.match(clock.stdout.trim(),/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
});

await test('Selection generation survives resume, due rewrites and added sources',async({root,put,run,outcome,progress})=>{
 const t=Date.now()-10000;await run('a',t);
 const first=await selectSources(root,'a',{employer:[],portal:['Portal']});
 const selectedAt=first.sources[0].selectedAt;
 await put('data/reports/runs/a/source-evidence.jsonl',JSON.stringify(outcome('portal','Portal',Date.parse(selectedAt))));
 const second=await selectSources(root,'a',{employer:['Keep'],portal:[]});
 assert.deepEqual(second.sources[0],first.sources[0]);
 assert.equal(second.sources.length,2);
 const due=JSON.parse(await fs.readFile(path.join(root,'data/reports/runs/a/due.json'),'utf8'));assert.deepEqual(due,{employer:['Keep'],portal:['Portal']});
 assert.equal((await progress()).initialSearch,'partial');
 await put('data/reports/runs/a/source-evidence.jsonl',[outcome('portal','Portal',Date.parse(selectedAt)),outcome('employer','Keep',Date.parse(second.sources[1].selectedAt))].map(JSON.stringify).join('\n'));
 assert.equal((await progress()).initialSearch,'complete');
 // Simulate interruption after the selection journal commit but before due.json replacement.
 const raw=JSON.parse(await fs.readFile(path.join(root,'data/reports/runs/a/due-selection.json'),'utf8'));
 raw.sources.push({kind:'employer',source:'Changed',selectedAt:new Date().toISOString(),selectionId:'fixture-generation'});
 await put('data/reports/runs/a/due-selection.json',raw);assert.equal((await progress()).initialSearch,'partial');
 const resumed=await selectSources(root,'a',{employer:[],portal:[]});assert.equal(resumed.sources.length,3);assert.deepEqual(resumed.sources[0],first.sources[0]);
 resumed.sources.push(resumed.sources[0]);await put('data/reports/runs/a/due-selection.json',resumed);
 assert.equal((await progress()).initialSearch,'partial');await assert.rejects(()=>selectSources(root,'a',{employer:[],portal:[]}),/duplicate/);
});

await test('Unchanged obligations survive two selective scope transitions; affected employers are reset',async({root,put,state,snapshot,workbook,run,outcome,progress})=>{
 const t=Date.now()-10000;
 await run('old',t,{status:'started',due:{employer:['Keep','Changed'],portal:['Portal']},evidence:[outcome('portal','Portal',t)]});
 let wb=await employerWorkbook({file:workbook});await employerWorkbook({file:workbook,action:'upsert',expectedRevision:wb.revision,records:[{Company:'Changed',Focus:'Edited'}]});
 const transition=await resetSetupScope(root,{confirmedStopped:true});assert.equal(transition.fromScope,snapshot.scope);assert.equal(transition.mode,'employers');
 let current=await setupSnapshot(root),time=Date.parse(transition.completedAt)+1;
 await run('new',time,{scope:current.scope,evidence:[outcome('employer','Changed',time)],due:{employer:['Changed'],portal:[]}});
 assert.equal((await progress()).initialSearch,'partial');assert((await progress()).searchProgress.blockers.some(b=>b.includes('employer|Keep')));
 assert(!(await progress()).searchProgress.blockers.some(b=>b.includes('portal|Portal')));
 const cli=spawnSync(process.execPath,[fileURLToPath(new URL('./setup-state.mjs',import.meta.url)),'source-work','--root',root],{encoding:'utf8'});
 assert.equal(cli.status,0,cli.stderr);const carried=JSON.parse(cli.stdout).sourceObligations;
 assert(carried.some(item=>item.kind==='employer' && item.source==='Keep'));
 await selectSources(root,'new',{employer:carried.filter(item=>item.kind==='employer').map(item=>item.source),portal:carried.filter(item=>item.kind==='portal').map(item=>item.source)});
 const finished=finishRun(path.join(root,'data'),'new');assert(finished.retry.some(item=>item.includes('Keep')));
 state.lastActiveScope=current.scope;state.lastActiveScopeParts=current.scopeParts;await put('data/reports/setup-state.json',state);
 wb=await employerWorkbook({file:workbook});await employerWorkbook({file:workbook,action:'upsert',expectedRevision:wb.revision,records:[{Company:'Third',Priority:'C'}]});
 const second=await resetSetupScope(root,{confirmedStopped:true});current=await setupSnapshot(root);time=Math.max(Date.parse(second.completedAt)+1,time+1);
 await run('newest',time,{scope:current.scope,due:{employer:['Third'],portal:[]},evidence:[outcome('employer','Third',time)]});
 assert.equal((await progress()).initialSearch,'partial');
 await put('data/reports/runs/newest/source-evidence.jsonl',[outcome('employer','Third',time),outcome('employer','Keep',time)].map(JSON.stringify).join('\n'));
 const result=await progress();assert.equal(result.initialSearch,'complete');assert(result.searchProgress.runIds.includes('old'));
 const previous=JSON.parse(await fs.readFile(path.join(root,'data/reports/setup-scope-reset.json'),'utf8'));delete previous.fromScope;
 await put('data/reports/setup-scope-reset.json',previous);assert.equal((await progress()).initialSearch,'partial');
 assert((await progress()).searchProgress.blockers.some(b=>b.includes('previous-scope transition')));
 const full=await resetSetupScope(root,{confirmedStopped:true,allSources:true});assert.equal(full.mode,'all');
});

await test('Only exact template guidance is exempt; quoted facts, examples and altered guidance fail',async({root,put,profile})=>{
 const guide='> Replace every `{{…}}` and every line starting with "Example:". Delete examples you do not need.\n';
 await put('profile/candidate_profile.md',guide+profile);assert.equal((await setupSnapshot(root)).profileValid,true);
 for(const line of ['> Eligibility: {{UNRESOLVED}}','>> Eligibility: {{UNKNOWN}}','> - Example: Fictional role','> Replace every `{{…}}` and every line starting with "Example:". Delete examples you do not need. Extra {{UNKNOWN}}']){
  await put('profile/candidate_profile.md',profile+'\n'+line);const result=await setupSnapshot(root);assert.equal(result.profileValid,false);assert(result.profileProblems.length);
 }
});

await test('Empty orphan classification inspects nested files and becomes stale on any added work',async({root,put,run,progress})=>{
 await run('done',Date.now()-1000);await put('data/reports/runs/orphan/run-ledger.jsonl','');assert.equal((await progress()).initialSearch,'partial');
 await classifyOrphan(root,'orphan',{kind:'empty',evidence:'Inspected whole initialization folder'});assert.equal((await progress()).initialSearch,'complete');
 await classifyOrphan(root,'orphan',{kind:'empty',evidence:'Repeated attended inspection'});assert((await fs.readdir(path.join(root,'data/reports/setup-backups'))).some(name=>name.startsWith('recovery-orphan-')));
 await put('data/reports/runs/orphan/nested/reader-result.jsonl','{"company":"Example","title":"Role"}');assert.equal((await progress()).initialSearch,'partial');
 await assert.rejects(()=>classifyOrphan(root,'orphan',{kind:'empty',evidence:'Not actually empty'}),/Empty classification/);
});

await test('Handover requires all files, captured finds, consumed references and successful target source checks',async({root,put,state,snapshot,run,outcome,progress})=>{
 const t=Date.now()-1000;await run('target',t);
 const find={company:'Fictional Employer',title:'Fictional Role',location:'Vienna',url:'https://example.org/jobs/one'};
 const contents={'run-ledger.jsonl':'','nested/finds.jsonl':JSON.stringify(find),'due.json':JSON.stringify({employer:[],portal:['Portal']})};
 const transfers=Object.keys(contents).map(file=>({file,kind:file==='due.json'?'due':'finds',target:'recovered/orphan/'+file}));
 for(const [file,value] of Object.entries(contents)){await put('data/reports/runs/orphan/'+file,value);await put('data/reports/runs/target/recovered/orphan/'+file,value);}
 const manifestFile='data/reports/runs/target/run-completion.json';const manifest=JSON.parse(await fs.readFile(path.join(root,manifestFile),'utf8'));
 const plan={kind:'handover',targetRun:'target',transfers,evidence:'Reviewed every file and target capture'};
 await assert.rejects(()=>classifyOrphan(root,'orphan',plan),/recoveredOrphans/);
 manifest.recoveredOrphans=[{runId:'orphan',files:transfers.map(t=>t.target)}];await put(manifestFile,manifest);
 await assert.rejects(()=>classifyOrphan(root,'orphan',plan),/missing from the target ledger/);
 await put('data/reports/runs/target/run-ledger.jsonl',JSON.stringify({...find,state:'excluded',reason:'Fictional test exclusion'}));
 await assert.rejects(()=>classifyOrphan(root,'orphan',plan),/successful target-run check/);
 await put('data/reports/runs/target/source-evidence.jsonl',JSON.stringify(outcome('portal','Portal',t)));
 const receipt=await classifyOrphan(root,'orphan',plan);assert.equal(receipt.setupId,state.setupId);assert.equal(receipt.targetScope,snapshot.scope);
 assert.equal((await progress()).initialSearch,'complete');
 await put('data/reports/runs/target/recovered/orphan/nested/finds.jsonl','changed');assert.equal((await progress()).initialSearch,'partial');
 assert.equal(await fs.readFile(path.join(root,'data/reports/runs/orphan/nested/finds.jsonl'),'utf8'),contents['nested/finds.jsonl']);
});
console.log(`setup obligations/recovery: ${count} scenarios passed`);
