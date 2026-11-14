import {spawn,fork} from 'node:child_process';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';
import {dataRoot} from './config.mjs';
import {writeJsonAtomic,withLock} from './store.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const installation=crypto.createHash('sha256').update(here+'\0'+dataRoot).digest('hex');
async function main(){
 const args=process.argv.slice(2),portIndex=args.indexOf('--port');
 if(args.some((arg,index)=>!['--stop','--restart','--background','--foreground','--port'].includes(arg)&&!(portIndex>=0&&index===portIndex+1))||portIndex>=0&&!args[portIndex+1])throw Error('Use --stop, --restart, --background or --port NUMBER.');
 const stop=args.includes('--stop'),restart=args.includes('--restart'),foreground=args.includes('--foreground');
 const background=args.includes('--background')||process.env.JOBTRACKER_NO_BROWSER==='1';
 const logDir=path.join(dataRoot,'logs');
 await import('./initialize.mjs');await mkdir(logDir,{recursive:true});
 const metadata=path.join(logDir,'server.json'),portFile=path.join(dataRoot,'server-port.json');
 const validPort=value=>Number.isInteger(Number(value))&&Number(value)>=1024&&Number(value)<=65535;
 let savedPort;
 try{savedPort=JSON.parse(await readFile(portFile,'utf8')).port;if(!validPort(savedPort))throw Error('Invalid saved port.');}catch(error){if(error.code!=='ENOENT')throw error;}
 const requestedPort=portIndex>=0?args[portIndex+1]:process.env.JOBTRACKER_PORT;
 if(requestedPort!==undefined&&!validPort(requestedPort))throw Error('Choose a port number from 1024 to 65535.');
 const port=Number(requestedPort??savedPort??8765);
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
 // Serialize concurrent Start clicks, so only one server is launched per folder.
 let child;
 await withLock(logDir,async()=>{
  const running=await runningServer();
  if(running){
   if(!stop&&!restart){
    if(requestedPort!==undefined&&Number(running.port)!==port)throw Error('Use --restart --port '+port+' to change the running tracker address.');
    // Adopt an older random-port server as this installation’s fixed address.
    if(savedPort===undefined&&requestedPort===undefined&&validPort(running.port))await writeJsonAtomic(portFile,{port:Number(running.port)});
    browse(running.href);console.log('Application tracker: '+running.href);return;
   }
   const response=await fetch(new URL('/api/stop',running),{method:'POST',headers:{Origin:running.origin},signal:AbortSignal.timeout(3000)});
   if(!response.ok)throw Error('The running Application tracker could not be stopped.');
   await response.json();
   // Wait for the old listener to release its port before restarting.
   for(let attempt=0;attempt<60;attempt++){
    if(!await runningServer())break;
    if(attempt===59)throw Error('The running tracker is still stopping. Try again.');
    await new Promise(resolve=>setTimeout(resolve,50));
   }
   console.log('Application tracker stopped.');
  }else if(stop)console.log('Application tracker is not running for this folder.');
  if(stop)return;
  const fs=await import('node:fs'),log=fs.openSync(path.join(logDir,'server.log'),'a');
  try{child=fork(path.join(here,'server.mjs'),[],{env:{...process.env,PORT:String(port)},detached:!foreground,stdio:['ignore',log,log,'ipc'],windowsHide:true});}finally{fs.closeSync(log);}
  const message=await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{child.kill();reject(Error('Application tracker did not start. See data/logs/server.log.'));},15000);
   const fail=error=>{clearTimeout(timer);reject(error);};
   child.once('error',fail);
   child.once('exit',()=>fail(Error('Could not start at http://127.0.0.1:'+port+'. Another app may use this port; see data/logs/server.log. Choose another fixed port with --port 8766.')));
   child.once('message',value=>{clearTimeout(timer);resolve(value);});
  });
  try{await writeJsonAtomic(portFile,{port});await writeJsonAtomic(metadata,message);}catch(error){child.kill();throw error;}
  console.log('Application tracker: '+message.url);browse(message.url);
  if(!foreground){child.disconnect();child.unref();}
 });
 // launchd tracks this parent until its server exits; normal Start is detached.
 if(foreground&&child&&child.exitCode===null)await new Promise(resolve=>child.once('exit',resolve));
}
try{await main();}catch(error){console.error('Application tracker: '+error.message);process.exitCode=1;}
