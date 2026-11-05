import {spawn,fork} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {dataRoot} from './config.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const installation=crypto.createHash('sha256').update(here+'\0'+dataRoot).digest('hex');
async function main(){
const logDir=path.join(dataRoot,'logs');
await import('./initialize.mjs');await mkdir(logDir,{recursive:true});
const metadata=path.join(logDir,'server.json');
function browse(url){
 if(process.env.JOBTRACKER_NO_BROWSER==='1')return;
 const executable=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
 const args=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
 const child=spawn(executable,args,{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>console.log(`Open ${url} in your browser.`));child.unref();
}
try{
 const old=JSON.parse(await readFile(metadata,'utf8'));const url=new URL(old.url);
 if(url.hostname==='127.0.0.1'&&url.protocol==='http:'){
  const response=await fetch(new URL('/api/health',url),{signal:AbortSignal.timeout(1000)});const health=await response.json();
  if(health.installation===installation){
   if(process.argv.includes('--stop')){await fetch(new URL('/api/stop',url),{method:'POST',headers:{Origin:url.origin},signal:AbortSignal.timeout(3000)});console.log('Application tracker stopped.');}
   else{browse(url.href);console.log(`Application tracker: ${url.href}`);}
   return;
  }
 }
}catch{}
if(process.argv.includes('--stop')){console.log('Application tracker is not running for this folder.');return;}
// The OS chooses a free port, avoiding other tracker installations and services.
const fs=await import('node:fs');const log=fs.openSync(path.join(logDir,'server.log'),'a');
const server=fork(path.join(here,'server.mjs'),[],{env:{...process.env,PORT:'0'},detached:true,stdio:['ignore',log,log,'ipc'],windowsHide:true});
fs.closeSync(log);
const timer=setTimeout(()=>{console.error('Application tracker did not start. See data/logs/server.log.');server.kill();process.exitCode=1;},15000);
server.once('error',error=>{clearTimeout(timer);console.error(error.message);process.exitCode=1;});
server.once('exit',code=>{clearTimeout(timer);if(code)console.error('Application tracker stopped before startup. See data/logs/server.log.');});
server.once('message',async message=>{
 clearTimeout(timer);const {writeFile}=await import('node:fs/promises');await writeFile(metadata,JSON.stringify(message));
 server.disconnect();server.unref();console.log(`Application tracker: ${message.url}`);browse(message.url);
});
}
await main();
