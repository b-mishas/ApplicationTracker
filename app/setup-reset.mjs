// Explicit, conservative scope replay while all searches are stopped. Journal before writes; safe to retry after interruption.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSetup, setupSnapshot, readSetupReset} from './setup-state.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {withLock,writeJsonAtomic} from './store.mjs';
import crypto from 'node:crypto';

// Which checkpoints the change can affect. If only employer rows changed since activation, replay only the
// added/edited employers; any eligibility, source or search-setting change (or unknown history) replays everything.
function replayPlan(state,snapshot){
 const previous=state.lastActiveScopeParts;
 if(!previous || previous.search!==snapshot.scopeParts.search)return {mode:'all'};
 return {mode:'employers',employers:[...new Set([...Object.keys(previous.employers),...Object.keys(snapshot.scopeParts.employers)])].filter(name=>previous.employers[name]!==snapshot.scopeParts.employers[name])};
}
export async function resetSetupScope(root,{confirmedStopped=false,recoverCurrentScope=false,allSources=false,beforeCoverage}={}){
 const {state}=await readSetup(root);
 if(state?.phase!=='editing' || !confirmedStopped)throw Error('Scope reset requires editing phase and explicit confirmation that schedules and active searches are stopped');
 const reports=path.join(root,'data/reports'),snapshot=await setupSnapshot(root);
 return withLock(reports,async()=>{
  if((await readSetup(root)).state?.phase!=='editing')throw Error('Setup phase changed; stop and reread');
  const receipt=path.join(reports,'setup-scope-reset.json');
  let journal=await readSetupReset(root);
  if(journal?.scope===snapshot.scope && journal.status==='complete' && !allSources)return journal;
  if(allSources && journal?.status==='started')throw Error('Recover the unfinished journal before requesting a new all-source replay');
  if(journal && journal.scope!==snapshot.scope && journal.status!=='complete'){
   if(!recoverCurrentScope)throw Error('Finish the interrupted scope reset before changing configuration again, or explicitly replay against the restored configuration with --recover-current-scope');
   await writeJsonAtomic(path.join(reports,'setup-backups',`scope-recovery-${Date.now()}-${crypto.randomUUID()}.json`),journal);
   // A partially applied all-source reset cannot safely be narrowed after a revert.
   journal={...journal,mode:'all',setupId:state.setupId,fromScope:state.lastActiveScope||null,recoveredFromScope:journal.scope,scope:snapshot.scope,restartedAt:new Date().toISOString()};
   await writeJsonAtomic(receipt,journal);
  }
  const coverageFile=path.join(reports,'coverage.json');
  if(!journal || journal.scope!==snapshot.scope || allSources){
   if(journal)await writeJsonAtomic(path.join(reports,'setup-backups',`scope-${Date.now()}-${crypto.randomUUID()}.json`),journal);
   const raw=await fs.readFile(coverageFile,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
   const coverage=raw===null?{}:JSON.parse(raw.replace(/^﻿/,''));
   journal={schemaVersion:1,setupId:state.setupId,fromScope:state.lastActiveScope||null,scope:snapshot.scope,status:'started',startedAt:new Date().toISOString(),...(allSources?{mode:'all'}:replayPlan(state,snapshot)),previousCoverage:coverage};
   await writeJsonAtomic(receipt,journal);
  }
  // Receipts written before plans existed replay everything.
  const all=journal.mode!=='employers',names=new Set(journal.employers||[]);
  const file=path.join(root,'profile/companies.xlsx'),{employers}=await employerWorkbook({file});
  const records=employers.filter(e=>all || names.has(e.Company)).map(e=>({Company:e.Company,'Last checked':''}));
  if(records.length)await employerWorkbook({file,action:'update',records});
  const coverage=structuredClone(journal.previousCoverage);
  if(all){
   coverage.gmailCheckedThrough=null;
   for(const source of Object.values(coverage.sources||{})){source.lastSuccessfulCheckedThrough=null;source.progress={};}
  }
  for(const [name,employer] of Object.entries(coverage.employers||{}))if(all || names.has(name)){employer.lastChecked='';employer.method='';}
  // Preserve dropped, refreshes, retries, access evidence and all run folders. Profile-hash rules handle old decisions.
  if(beforeCoverage)await beforeCoverage();
  await writeJsonAtomic(coverageFile,coverage);
  journal={...journal,status:'complete',completedAt:new Date().toISOString()};
  await writeJsonAtomic(receipt,journal);
  return journal;
 });
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{
  const args=process.argv.slice(2),i=args.indexOf('--root');
  const root=path.resolve(i<0?'.':args[i+1]);
  console.log(JSON.stringify(await resetSetupScope(root,{confirmedStopped:args.includes('--confirmed-stopped'),recoverCurrentScope:args.includes('--recover-current-scope'),allSources:args.includes('--all-sources')})));
 }catch(e){console.error(e.message);process.exitCode=2;}
}
