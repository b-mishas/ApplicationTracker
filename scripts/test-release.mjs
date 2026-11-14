// Run only after building: exercise an extracted package without global Node/npm.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import {auditRelease} from './audit-release.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'Application tracker & release-'));
let directory;
try{
 const forbidden=new JSZip();forbidden.file('Application tracker/AGENTS.md','Developer instructions');await assert.rejects(()=>auditRelease(forbidden),/developer instruction/);
 const privateFixture=new JSZip();privateFixture.file('Application tracker/example.md','PRIVATE_FIXTURE_VALUE');await assert.rejects(()=>auditRelease(privateFixture,{denyTerms:['PRIVATE_FIXTURE_VALUE']}),/forbidden private marker/);
 const targets=[
  {name:'windows-x64',runtime:'win-x64',os:'windows'},
  {name:'mac-intel',runtime:'darwin-x64',os:'mac'}
 ];
 let zip;
 for(const target of targets){
  const filename=`Application-tracker-${target.name}.zip`;
  const bytes=await fs.readFile(path.join(root,'dist',filename));
  const checksum=(await fs.readFile(path.join(root,'dist',filename+'.sha256'),'utf8')).trim();
  assert.equal(checksum,crypto.createHash('sha256').update(bytes).digest('hex')+'  '+filename);
  const candidate=await JSZip.loadAsync(bytes);
  await auditRelease(candidate);
  const names=Object.keys(candidate.files).filter(name=>!candidate.files[name].dir);
  const runtimeDirs=Object.keys(candidate.files).filter(name=>/^Application tracker\/runtime\/[^/]+\/$/.test(name));
  assert.deepEqual(runtimeDirs,[`Application tracker/runtime/${target.runtime}/`],`Expected exactly one runtime folder in ${filename}`);
  const runtimeFiles=names.filter(name=>name.startsWith('Application tracker/runtime/'));
  assert(runtimeFiles.length>0,`No runtime in ${filename}`);
  assert(runtimeFiles.every(name=>name.startsWith(`Application tracker/runtime/${target.runtime}/`)),`Extra runtime in ${filename}`);
  assert.equal(runtimeFiles.filter(name=>/\/(?:node|node\.exe)$/.test(name)).length,1,`Expected one Node executable in ${filename}`);
  const metadata=JSON.parse(await candidate.file('Application tracker/RUNTIME_CHECKSUMS.json').async('string'));
  assert.equal(metadata.artifacts.length,1,`Expected one checksum entry in ${filename}`);
  assert.equal(metadata.artifacts[0].file.includes(target.os==='windows'?'-win-x64.':'-darwin-x64.'),true);
  const own=target.os==='windows'?['Start (Windows).cmd','Stop Windows.cmd']:['Start (Mac).command','Stop macOS.command'];
  const other=target.os==='windows'?['Start (Mac).command','Stop macOS.command']:['Start (Windows).cmd','Stop Windows.cmd'];
  for(const name of own)assert(candidate.file('Application tracker/'+name),`${filename} missing ${name}`);
  for(const name of other)assert(!candidate.file('Application tracker/'+name),`${filename} contains ${name}`);
  for(const entry of Object.values(candidate.files))if(!entry.dir&&entry.name.startsWith('Application tracker/app/'))assert.deepEqual(await entry.async('nodebuffer'),await fs.readFile(path.join(root,entry.name.replace('Application tracker/',''))),`Stale release file: ${entry.name}`);
  if(target.os==='mac'){
   assert.equal(candidate.file('Application tracker/Start (Mac).command').unixPermissions&0o777,0o755);
   assert.equal(candidate.file('Application tracker/runtime/darwin-x64/node').unixPermissions&0o777,0o755);
   for(const name of own)assert(!((await candidate.file('Application tracker/'+name).async('string')).includes('\r')),`${filename} contains CRLF in ${name}`);
  }
  console.log(`PASS: ${filename} audit, checksum, current app files, one runtime, platform starters${target.os==='mac'?', Mac executable permissions':''}.`);
  if(target.runtime===`${process.platform==='win32'?'win':'darwin'}-${process.arch}`)zip=candidate;
 }
 if(!zip)throw Error('No release archive matches this host');
 console.log('Checking extracted host package...');
 for(const entry of Object.values(zip.files)){
  const destination=path.resolve(temp,entry.name);
  if(!destination.startsWith(temp+path.sep))throw Error('Unsafe ZIP path');
  if(entry.dir){await fs.mkdir(destination,{recursive:true});continue;}
  await fs.mkdir(path.dirname(destination),{recursive:true});await fs.writeFile(destination,await entry.async('nodebuffer'),{mode:entry.unixPermissions?entry.unixPermissions&0o777:0o644});
 }
 console.log('Extraction complete; starting packaged tracker...');
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
 console.log('First start complete; checking server...');
 const state=JSON.parse(await fs.readFile(path.join(directory,'data/logs/server.json'),'utf8'));
 assert.match(await (await fetch(state.url,{signal:AbortSignal.timeout(10000)})).text(),/Application tracker/);
 assert.deepEqual((await(await fetch(state.url+'/api/jobs',{signal:AbortSignal.timeout(10000)})).json()).data.jobs,[]);
 const repeatedOutput=start();
 const repeated=JSON.parse(await fs.readFile(path.join(directory,'data/logs/server.json'),'utf8'));
 if(process.platform==='win32')assert.match(repeatedOutput,/Application tracker stopped\./);
 else assert.equal(repeated.url,state.url);
 assert.match(await (await fetch(repeated.url,{signal:AbortSignal.timeout(10000)})).text(),/Application tracker/);
 assert.match(invoke('self-check.mjs'),/OK Excel export/);
 assert.equal((await fetch(repeated.url+'/api/export/applications.xlsx',{signal:AbortSignal.timeout(10000)})).status,200);
 assert.deepEqual(JSON.parse(await fs.readFile(path.join(directory,'settings/tracker.json'),'utf8')),{schemaVersion:1,exportLanguage:'en'});
 assert(!Object.keys(zip.files).some(n=>/^Application tracker\/(?:HANDOFF|PLAN|HISTORY|CLAUDE)\.md$/.test(n)));
 const stopCommand=process.platform==='win32'?'Stop Windows.cmd':'Stop macOS.command';
 const stopArgs=process.platform==='win32'?['/d','/s','/c',`""${path.join(directory,stopCommand)}""`]:[path.join(directory,stopCommand)];
 const stopped=spawnSync(command,stopArgs,{env,encoding:'utf8',timeout:30000,windowsHide:true,windowsVerbatimArguments:process.platform==='win32'});
 assert.equal(stopped.status,0,stopped.stderr||stopped.stdout);
 assert.match(stopped.stdout,/Application tracker stopped\./);
 console.log('PASS: clean host ZIP extraction in a path with spaces/&; Start and Stop without global Node; repeat launch; empty UI/inventory; self-check; Excel download; neutral settings; private-file exclusion.');
}finally{
 if(directory){try{const runtime=path.join(directory,'runtime',`${process.platform==='win32'?'win':'darwin'}-${process.arch}`,process.platform==='win32'?'node.exe':'node');spawnSync(runtime,[path.join(directory,'app/launch.mjs'),'--stop'],{env:{...process.env,JOBTRACKER_DATA_DIR:path.join(directory,'data'),JOBTRACKER_SETTINGS_FILE:path.join(directory,'settings/tracker.json'),JOBTRACKER_NO_BROWSER:'1'},timeout:10000,windowsHide:true});}catch{}}
 await fs.rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:500});
}
