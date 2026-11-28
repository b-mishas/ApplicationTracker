// Runs the M7 recovery outcome scenarios (app/test-recovery-outcomes.mjs) against a reference revision of the recovery
// helpers, extracted from Git into a temporary folder. Maintainer comparison only; not part of npm test or releases.
//   node scripts/compare-recovery-baseline.mjs [revision]   (default 4931d22, the design before M7)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';

const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),revision=process.argv[2]||'4931d22';
const git=(...args)=>execFileSync('git',['-C',repo,...args],{maxBuffer:64*1024*1024});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'recovery-baseline-')),modules=path.join(tmp,'node_modules');
try{
 for(const file of git('ls-tree','-r','--name-only',revision,'app','templates/profile').toString().split('\n').filter(Boolean)){
  fs.mkdirSync(path.dirname(path.join(tmp,file)),{recursive:true});fs.writeFileSync(path.join(tmp,file),git('show',`${revision}:${file}`));
 }
 fs.symlinkSync(path.join(repo,'node_modules'),modules,'junction');
 const harness=await import(pathToFileURL(path.join(repo,'app/test-recovery-outcomes.mjs')));
 const base=pathToFileURL(path.join(tmp,'app')+'/'),lib=await harness.loadLib(base),progress=await import(new URL('setup-progress.mjs',base));
 const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)).map(f=>`${e.name}/${f}`):[e.name]);
 // Adapter for the reference design: journalled selections, source-work obligations and attended orphan classification.
 const ops={
  select:(w,id,sources)=>progress.selectSources(w.root,id,sources),
  async owed(w,lib){
   // The reference routine asks source-work after creating its run folder: emulate that next run, then remove it.
   const probe=await w.run('probe');
   try{return [...((await w.progress()).sourceObligations||[]).map(o=>`${o.kind}|${o.source}`),...w.retryKeys(lib.previousRetry(w.data,probe).retry)];}
   finally{fs.rmSync(path.join(w.root,w.runDir(probe)),{recursive:true,force:true});}
  },
  async takeOver(w,orphan,target){
   w.attended++;
   const src=path.join(w.root,w.runDir(orphan));
   const kind=f=>/(^|\/)(due|due-selection)\.json$/.test(f)?'due':/(^|\/)(source-evidence|evidence-.*)\.jsonl$/.test(f)?'sources':/\.jsonl?$/.test(f)?'finds':'support';
   const transfers=files(src).filter(f=>f!=='setup-recovery.json').map(f=>({file:f,kind:kind(f),target:`recovered/${orphan}/${f}`}));
   for(const t of transfers){const to=path.join(w.root,w.runDir(target),t.target);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(src,t.file),to);}
   const mf=`${w.runDir(target)}/run-completion.json`,m=await w.json(mf);
   m.recoveredOrphans=[...(m.recoveredOrphans||[]).filter(r=>r.runId!==orphan),{runId:orphan,files:transfers.map(t=>t.target)}];await w.put(mf,m);
   try{await progress.classifyOrphan(w.root,orphan,{kind:'handover',targetRun:target,transfers,evidence:'Fixture attended review'});}catch{}
  },
  async acknowledgeEmpty(w,orphan){w.attended++;await progress.classifyOrphan(w.root,orphan,{kind:'empty',evidence:'Fixture attended inspection'});},
 };
 console.log(`Reference ${revision}:`);
 harness.report(await harness.runScenarios(lib,ops));
}finally{
 // Remove the junction itself first so the cleanup can never reach the real node_modules.
 if(fs.existsSync(modules))fs.unlinkSync(modules);
 fs.rmSync(tmp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
