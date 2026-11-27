// Explicit, conservative scope replay while all searches are stopped. Journal before writes; safe to retry after interruption.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readSetup, setupSnapshot, readSetupReset} from './setup-state.mjs';
import {employerWorkbook} from './employer-workbook.mjs';
import {withLock,writeJsonAtomic} from './store.mjs';

export async function resetSetupScope(root,{confirmedStopped=false,recoverCurrentScope=false,beforeCoverage}={}){
 const {state}=await readSetup(root);
 if(state?.phase!=='editing' || !confirmedStopped)throw Error('Scope reset requires editing phase and explicit confirmation that schedules and active searches are stopped');
 const reports=path.join(root,'data/reports'),snapshot=await setupSnapshot(root);
 return withLock(reports,async()=>{
  if((await readSetup(root)).state?.phase!=='editing')throw Error('Setup phase changed; stop and reread');
  const receipt=path.join(reports,'setup-scope-reset.json');
  let journal=await readSetupReset(root);
  if(journal?.scope===snapshot.scope && journal.status==='complete')return journal;
  if(journal && journal.scope!==snapshot.scope && journal.status!=='complete'){
   if(!recoverCurrentScope)throw Error('Finish the interrupted scope reset before changing configuration again, or explicitly replay against the restored configuration with --recover-current-scope');
   await writeJsonAtomic(path.join(reports,'setup-backups',`scope-recovery-${Date.now()}.json`),journal);
   journal={...journal,recoveredFromScope:journal.scope,scope:snapshot.scope,restartedAt:new Date().toISOString()};
   await writeJsonAtomic(receipt,journal);
  }
  const coverageFile=path.join(reports,'coverage.json');
  if(!journal || journal.scope!==snapshot.scope){
   if(journal)await writeJsonAtomic(path.join(reports,'setup-backups',`scope-${Date.now()}.json`),journal);
   const raw=await fs.readFile(coverageFile,'utf8').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
   const coverage=raw===null?{}:JSON.parse(raw);
   journal={schemaVersion:1,scope:snapshot.scope,status:'started',startedAt:new Date().toISOString(),previousCoverage:coverage};
   await writeJsonAtomic(receipt,journal);
  }
  // Replay all sources for now: modest extra work avoids guessing which prose rule altered search eligibility.
  const {employers}=await employerWorkbook({file:path.join(root,'profile/companies.xlsx')});
  await employerWorkbook({file:path.join(root,'profile/companies.xlsx'),action:'update',records:employers.map(e=>({Company:e.Company,'Last checked':''}))});
  const coverage=structuredClone(journal.previousCoverage);
  coverage.gmailCheckedThrough=null;
  for(const source of Object.values(coverage.sources||{})){source.lastSuccessfulCheckedThrough=null;source.progress={};}
  for(const employer of Object.values(coverage.employers||{})){employer.lastChecked='';employer.method='';}
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
  console.log(JSON.stringify(await resetSetupScope(root,{confirmedStopped:args.includes('--confirmed-stopped'),recoverCurrentScope:args.includes('--recover-current-scope')})));
 }catch(e){console.error(e.message);process.exitCode=2;}
}
