// Run only after building: exercise an extracted package without global Node/npm.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import JSZip from 'jszip';
import {auditRelease} from './audit-release.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'Application tracker & release-'));
let directory;
try{
 const zip=await JSZip.loadAsync(await fs.readFile(path.join(root,'dist/Application-tracker.zip')));
 await auditRelease(zip);
 const forbidden=new JSZip();forbidden.file('Application tracker/AGENTS.md','Developer instructions');await assert.rejects(()=>auditRelease(forbidden),/developer instruction/);
 const privateFixture=new JSZip();privateFixture.file('Application tracker/example.md','PRIVATE_FIXTURE_VALUE');await assert.rejects(()=>auditRelease(privateFixture,{denyTerms:['PRIVATE_FIXTURE_VALUE']}),/forbidden private marker/);
 for(const entry of Object.values(zip.files))if(!entry.dir&&entry.name.startsWith('Application tracker/app/'))assert.deepEqual(await entry.async('nodebuffer'),await fs.readFile(path.join(root,entry.name.replace('Application tracker/',''))),`Stale release file: ${entry.name}`);
 for(const entry of Object.values(zip.files)){
  const destination=path.resolve(temp,entry.name);
  if(!destination.startsWith(temp+path.sep))throw Error('Unsafe ZIP path');
  if(entry.dir){await fs.mkdir(destination,{recursive:true});continue;}
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,await entry.async('nodebuffer'),{mode:entry.unixPermissions?entry.unixPermissions&0o777:0o644});
 }
 directory=path.join(temp,'Application tracker');
 const env={...process.env,PATH:process.platform==='win32'?path.join(process.env.SystemRoot,'System32'):'/usr/bin:/bin',JOBTRACKER_NO_BROWSER:'1'};
 delete env.JOBTRACKER_DATA_DIR;delete env.JOBTRACKER_SETTINGS_FILE;
 const runtime=path.join(directory,'runtime',`${process.platform==='win32'?'win':'darwin'}-${process.arch}`,process.platform==='win32'?'node.exe':'node');
 const invoke=(script,args=[])=>{const r=spawnSync(runtime,[path.join(directory,'app',script),...args],{env,encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(r.status,0,r.stderr||r.stdout);return r.stdout;};
 const starter=process.platform==='win32'?'Start (Windows).cmd':'Start (Mac).command';
 const command=process.platform==='win32'?process.env.ComSpec:'/bin/sh';
 const args=process.platform==='win32'?['/d','/s','/c',`""${path.join(directory,starter)}""`]:[path.join(directory,starter)];
 const start=()=>{const result=spawnSync(command,args,{env,encoding:'utf8',timeout:30000,windowsHide:true,windowsVerbatimArguments:process.platform==='win32'});assert.equal(result.status,0,result.stderr||result.stdout);return result.stdout;};
 start();
 const state=JSON.parse(await fs.readFile(path.join(directory,'data/logs/server.json'),'utf8'));
 assert.match(await (await fetch(state.url)).text(),/Application tracker/);
 assert.deepEqual((await(await fetch(state.url+'/api/jobs')).json()).data.jobs,[]);
 const repeatedOutput=start();
 const repeated=JSON.parse(await fs.readFile(path.join(directory,'data/logs/server.json'),'utf8'));
 if(process.platform==='win32')assert.match(repeatedOutput,/Application tracker stopped\./);
 else assert.equal(repeated.url,state.url);
 assert.match(await (await fetch(repeated.url)).text(),/Application tracker/);
 assert.match(invoke('self-check.mjs'),/OK Excel export/);
 assert.equal((await fetch(repeated.url+'/api/export/applications.xlsx')).status,200);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'settings/tracker.json'),'utf8')),{schemaVersion:1,exportLanguage:'en'});
 assert(!Object.keys(zip.files).some(n=>/^Application tracker\/(?:HANDOFF|PLAN|HISTORY|CLAUDE)\.md$/.test(n)));
 assert.equal(zip.file('Application tracker/Start (Mac).command').unixPermissions&0o777,0o755);
 assert.equal(zip.file('Application tracker/runtime/darwin-arm64/node').unixPermissions&0o777,0o755);
 console.log('PASS: clean ZIP extraction in a path with spaces/&; platform starter without global Node; repeat launch; empty UI/inventory; self-check; Excel download; neutral settings; private-file exclusion; Mac executable permissions.');
 invoke('launch.mjs',['--stop']);
}finally{
 if(directory){try{const runtime=path.join(directory,'runtime',`${process.platform==='win32'?'win':'darwin'}-${process.arch}`,process.platform==='win32'?'node.exe':'node');spawnSync(runtime,[path.join(directory,'app/launch.mjs'),'--stop'],{env:{...process.env,JOBTRACKER_DATA_DIR:path.join(directory,'data'),JOBTRACKER_SETTINGS_FILE:path.join(directory,'settings/tracker.json'),JOBTRACKER_NO_BROWSER:'1'},timeout:10000,windowsHide:true});}catch{}}
 await fs.rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:500});
}
