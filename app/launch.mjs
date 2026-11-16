import {spawn,fork} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import {openSync,closeSync,appendFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {createInterface} from 'node:readline';
import {dataRoot} from './config.mjs';
import {writeJsonAtomic,withLock} from './store.mjs';
import {readStoredPort,validatePort,configuredPort,assertPortAvailable} from './port-settings.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const installation=crypto.createHash('sha256').update(here+'\0'+dataRoot).digest('hex');
async function main(){
 const args=process.argv.slice(2),portIndex=args.indexOf('--port');
 if(args.some((arg,index)=>!['--stop','--restart','--background','--foreground','--interactive','--port'].includes(arg)&&!(portIndex>=0&&index===portIndex+1))||portIndex>=0&&!args[portIndex+1])throw Error('Use --stop, --restart, --background, --interactive or --port NUMBER.');
 const stop=args.includes('--stop'),restart=args.includes('--restart'),foreground=args.includes('--foreground');
 const background=args.includes('--background')||process.env.JOBTRACKER_NO_BROWSER==='1';
 // Only explicit starters offer a terminal prompt; login and automation stay quiet.
 const interactive=args.includes('--interactive')&&!args.includes('--background');
 const requestedPort=portIndex>=0?validatePort(args[portIndex+1]):undefined;
 const logDir=path.join(dataRoot,'logs');
 await import('./initialize.mjs');await mkdir(logDir,{recursive:true});
 const metadata=path.join(logDir,'server.json'),portFile=path.join(dataRoot,'server-port.json');
 function browse(url){
  if(background)return;
  const executable=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
  const child=spawn(executable,process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url],{detached:true,stdio:'ignore',windowsHide:true});child.on('error',()=>console.log('Open '+url+' in your browser.'));child.unref();
 }
 async function runningServer(){
  try{
   const old=JSON.parse(await readFile(metadata,'utf8')),url=new URL(old.url);
   if(url.hostname!=='127.0.0.1'||url.protocol!=='http:')return;
   const response=await fetch(new URL('/api/health',url),{signal:AbortSignal.timeout(1000)});
   if(response.ok&&(await response.json()).installation===installation)return url;
  }catch{ /* Missing or stale metadata. */ }
 }
 async function availablePort(port,currentPort){
  try{await assertPortAvailable(port,currentPort);return port;}catch(error){if(error.code!=='EADDRINUSE')throw error;if(!interactive)throw Error(error.message+' Use --port 8766 to choose another fixed address.');}
  const lines=createInterface({input:process.stdin,crlfDelay:Infinity}),answers=lines[Symbol.asyncIterator]();
  try{
   for(;;){
    process.stdout.write('Port '+port+' is in use. Enter another port (1024–65535), or press Enter to cancel: ');
    const answer=await answers.next();if(answer.done||!answer.value.trim())throw Error('Startup cancelled. No port changes saved.');
    try{const candidate=validatePort(answer.value.trim());await assertPortAvailable(candidate,currentPort);return candidate;}catch(error){if(error.code!=='EADDRINUSE'&&!error.message.startsWith('Choose a whole port'))throw error;console.log(error.message);}
   }
  }finally{lines.close();}
 }
 let child,promptPort;
 // Settings and Start share the same lock so they cannot overwrite each other.
 for(;;){try{await withLock(logDir,async()=>{
  const stored=await readStoredPort(),running=await runningServer();
  let port=promptPort??requestedPort??configuredPort(stored);
  if(running&&!stop&&!restart){
   if(requestedPort!==undefined&&Number(running.port)!==port)throw Error('Use --restart --port '+port+' to change the running tracker address.');
   if(stored.port===undefined&&requestedPort===undefined&&process.env.JOBTRACKER_PORT===undefined)await writeJsonAtomic(portFile,{port:Number(running.port)});
   browse(running.href);console.log('Application tracker: '+running.href);return;
  }
  // Test the new port before stopping the working server. Cancel/conflict leaves it alive.
  if(!stop)await assertPortAvailable(port,running?Number(running.port):undefined);
  if(running){
   const response=await fetch(new URL('/api/stop',running),{method:'POST',headers:{Origin:running.origin},signal:AbortSignal.timeout(3000)});
   if(!response.ok)throw Error('The running Application tracker could not be stopped.');
   await response.json();
   for(let attempt=0;attempt<60;attempt++){
    if(!await runningServer())break;
    if(attempt===59)throw Error('The running tracker is still stopping. Try again.');
    await new Promise(resolve=>setTimeout(resolve,50));
   }
   console.log('Application tracker stopped.');
  }else if(stop)console.log('Application tracker is not running for this folder.');
  if(stop)return;
  async function startServer(selected,{savePort=true}={}){
   const log=openSync(path.join(logDir,'server.log'),'a');
   try{child=fork(path.join(here,'server.mjs'),[],{env:{...process.env,PORT:String(selected)},detached:!foreground,stdio:['ignore',log,log,'ipc'],windowsHide:true});}finally{closeSync(log);}
   const message=await new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill();reject(Error('Application tracker did not start. See data/logs/server.log.'));},15000);
    const fail=error=>{clearTimeout(timer);reject(error);};
    child.once('error',fail);
    child.once('exit',()=>fail(Error('Could not start at http://127.0.0.1:'+selected+'. See data/logs/server.log.')));
    child.once('message',value=>{clearTimeout(timer);resolve(value);});
   });
   try{if(savePort)await writeJsonAtomic(portFile,{port:selected});await writeJsonAtomic(metadata,message);}catch(error){child.kill();throw error;}
   if(!foreground){child.disconnect();child.unref();}
   return message;
  }
  let message;
  try{message=await startServer(port);}catch(error){
   // A different process can claim the new port between the probe and listen.
   if(running&&port!==Number(running.port)){
    try{await startServer(Number(running.port),{savePort:false});console.error('The previous address was restored: '+running.href);}catch(restoreError){throw Error(error.message+' Recovery also failed: '+restoreError.message);}
   }
   throw error;
  }
  console.log('Application tracker: '+message.url);browse(message.url);
 });break;
 }catch(error){
  if(error.code!=='EADDRINUSE')throw error;
  // Release the installation lock before waiting for a person to answer.
  const running=await runningServer();promptPort=await availablePort(error.port,running?Number(running.port):undefined);
 }}
 if(foreground&&child&&child.exitCode===null)await new Promise(resolve=>child.once('exit',resolve));
}
try{await main();}catch(error){
 console.error('Application tracker: '+error.message);process.exitCode=1;
 // The login start has no window; record why it failed.
 if(process.argv.includes('--background'))try{appendFileSync(path.join(dataRoot,'logs','login.log'),new Date().toISOString()+' '+error.message+'\n');}catch{ /* Log folder unavailable. */ }
}
