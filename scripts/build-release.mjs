// Curate a release from pristine templates, never from the user's runtime/profile.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import {auditRelease} from './audit-release.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await fs.readFile(new URL('./runtime-manifest.json',import.meta.url),'utf8'));
const cache=process.env.JOBTRACKER_BUILD_CACHE||path.join(root,'.build-cache');await fs.mkdir(cache,{recursive:true});
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
// Git Bash can put GNU tar first on PATH. Windows tar accepts drive-letter archive paths.
const tar=process.platform==='win32'?path.join(process.env.SystemRoot||'C:/Windows','System32','tar.exe'):'tar';

async function refreshCheckoutRuntime(directory,name,executable,license){
 await fs.mkdir(directory,{recursive:true});
 const target=path.join(directory,name);
 const installed=await fs.readFile(target).catch(error=>{if(error.code!=='ENOENT')throw error;});
 if(!installed?.equals(executable)){
  // Replace in one step so a running Windows executable can remain in place.
  const temporary=target+'.'+crypto.randomUUID()+'.tmp';
  try{
   await fs.writeFile(temporary,executable,{mode:0o755,flag:'wx'});
   try{await fs.rename(temporary,target);}catch(error){
    if(process.platform!=='win32'||!installed||!['EBUSY','EPERM','EACCES'].includes(error.code))throw error;
    console.warn('Could not refresh '+target+' ('+error.code+'). The ZIP uses the verified runtime. If the tracker is running, stop it and rerun the build to refresh the checkout.');
    return;
   }
  }finally{await fs.rm(temporary,{force:true});}
 }
 await fs.writeFile(path.join(directory,'LICENSE'),license);
}
const archive=new JSZip();
const add=(name,data,executable=false)=>archive.file('Application tracker/'+name,data,{unixPermissions:executable?0o100755:0o100644});
async function tree(source,destination){
 for(const entry of await fs.readdir(source,{withFileTypes:true})){
  if(entry.isSymbolicLink())throw Error(`Unexpected symlink: ${source}/${entry.name}`);
  const from=path.join(source,entry.name),to=destination+'/'+entry.name;
  if(entry.isDirectory())await tree(from,to);else add(to,await fs.readFile(from),entry.name.endsWith('.command'));
 }
}
for(const item of manifest.artifacts){
 const cached=path.join(cache,item.file);
 let bytes=await fs.readFile(cached).catch(()=>null);
 if(!bytes||digest(bytes)!==item.sha256){
  console.log('Downloading '+item.file);
  const response=await fetch('https://nodejs.org/dist/'+manifest.version+'/'+item.file,{signal:AbortSignal.timeout(180000)});if(!response.ok)throw Error('Download failed: '+response.status);
  bytes=Buffer.from(await response.arrayBuffer());if(digest(bytes)!==item.sha256)throw Error('Runtime checksum mismatch: '+item.file);
  await fs.writeFile(cached,bytes);
 }
 const platform=item.file.includes('-win-')?'win':'darwin',arch=item.file.includes('-arm64')?'arm64':'x64',prefix=`node-${manifest.version}-${platform}-${arch}`;
 let executable,license;
 if(platform==='win'){
  const zip=await JSZip.loadAsync(bytes);executable=await zip.file(prefix+'/node.exe').async('nodebuffer');license=await zip.file(prefix+'/LICENSE').async('nodebuffer');
 }else{
  const destination=path.join(cache,prefix);await fs.mkdir(destination,{recursive:true});
  const extracted=spawnSync(tar,['-xzf',cached,'-C',destination,'--strip-components=1',prefix+'/bin/node',prefix+'/LICENSE'],{encoding:'utf8',windowsHide:true});
  if(extracted.status!==0)throw Error('Could not extract Mac runtime: '+(extracted.stderr||extracted.error));
  executable=await fs.readFile(path.join(destination,'bin/node'));license=await fs.readFile(path.join(destination,'LICENSE'));
 }
 const runtime=`runtime/${platform}-${arch}`,name=platform==='win'?'node.exe':'node';
 add(runtime+'/'+name,executable,true);add(runtime+'/LICENSE',license);
 // Also make the source checkout's starters usable without a global Node install.
 await refreshCheckoutRuntime(path.join(root,runtime),name,executable,license);
 console.log('Verified '+item.file);
}
for(const name of ['app.js','batch.schema.json','config.mjs','countries.json','employer-workbook.mjs','export-applications.mjs','group-colours.mjs','import-discoveries.mjs','index.html','inventory.schema.json','initialize.mjs','jsonschema.mjs','launch.mjs','print-applications.mjs','README.md','SEARCH_WORKFLOW.md','self-check.mjs','settings-cli.mjs','server.mjs','settings.mjs','status-history.mjs','store.mjs','style.css','view-model.mjs'])add('app/'+name,await fs.readFile(path.join(root,'app',name)));
await tree(path.join(root,'node_modules'),'node_modules');
for(const name of ['agent','guides','profile'])await tree(path.join(root,'templates',name),name);
for(const name of ['Start (Windows).cmd','Start (Mac).command','Stop Windows.cmd','Stop macOS.command','START_HERE.html','THIRD_PARTY_NOTICES.md','package.json','package-lock.json'])add(name,await fs.readFile(path.join(root,name)),name.endsWith('.command'));
add('settings/tracker.json',JSON.stringify({schemaVersion:1,exportLanguage:'en'},null,2)+'\n');
add('data/jobs.json',JSON.stringify({schemaVersion:1,jobs:[]},null,2)+'\n');
for(const sub of ['incoming/imported','reports','backups','exports'])archive.folder('Application tracker/data/'+sub);
add('RUNTIME_CHECKSUMS.json',JSON.stringify(manifest,null,2));
const names=Object.keys(archive.files);
if(names.some(n=>/^Application tracker\/(?:\.git(?:\/|$)|(?:CLAUDE|HANDOFF|PLAN|HISTORY|PORTABILITY)\.md$|agent\/ROUTINE_PROMPT\.filled\.md$|profile\/cv\/(?!README\.txt$))/.test(n)&&!n.endsWith('/')))throw Error('Private/developer content in release.');
const denyTerms=process.env.JOBTRACKER_RELEASE_DENY_TERMS_FILE?JSON.parse(await fs.readFile(process.env.JOBTRACKER_RELEASE_DENY_TERMS_FILE,'utf8')):[];
console.log('Release audit: '+JSON.stringify(await auditRelease(archive,{denyTerms})));
const dist=path.join(root,'dist');await fs.mkdir(dist,{recursive:true});const output=path.join(dist,'Application-tracker.zip');
await fs.writeFile(output,await archive.generateAsync({type:'nodebuffer',platform:'UNIX',compression:'DEFLATE',compressionOptions:{level:6}}));
await fs.writeFile(output+'.sha256',digest(await fs.readFile(output))+'  Application-tracker.zip\n');
console.log('Release: '+output);
