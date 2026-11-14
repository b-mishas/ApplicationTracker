// Exercise local lifecycle and login registration with disposable data only.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {readStartup,saveStartup,startupRegistration} from './startup.mjs';
const execute=promisify(execFile),launch=fileURLToPath(new URL('./launch.mjs',import.meta.url));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),"Tracker's login & test-"));
const root=path.join(temp,'data'),settings=path.join(temp,'settings','tracker.json');
const env={...process.env,JOBTRACKER_DATA_DIR:root,JOBTRACKER_SETTINGS_FILE:settings,JOBTRACKER_NO_BROWSER:'1',APPDATA:path.join(temp,'AppData')};
delete env.JOBTRACKER_PORT;
const options={appData:env.APPDATA,home:temp,data:root,settings,launch};
const metadata=path.join(root,'logs','server.json');
let blocker;
async function invoke(args=[],extra={}){return execute(process.execPath,[launch,...args],{env,...extra,windowsHide:true,timeout:25000});}
async function freePort(){const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});const port=server.address().port;await new Promise(resolve=>server.close(resolve));return port;}
const until=async check=>{for(let i=0;i<100;i++){if(await check())return;await new Promise(resolve=>setTimeout(resolve,50));}throw Error('Timed out');};
try{
 // Default-port conflicts must fail, without touching any unrelated server.
 blocker=net.createServer();
 await new Promise((resolve,reject)=>{blocker.once('error',e=>e.code==='EADDRINUSE'?resolve():reject(e));blocker.listen(8765,'127.0.0.1',resolve);});
 await assert.rejects(()=>invoke(),error=>/127\.0\.0\.1:8765/.test(error.stderr)&&/--port 8766/.test(error.stderr));
 await assert.rejects(()=>fs.access(path.join(root,'server-port.json')),{code:'ENOENT'});
 if(blocker.listening)await new Promise(resolve=>blocker.close(resolve));blocker=undefined;
 console.log('PASS: occupied default port reports the conflict without random fallback or saving a failed address.');
 const port=await freePort();
 await Promise.all([invoke(['--port',String(port)]),invoke(['--port',String(port)])]);
 let state=JSON.parse(await fs.readFile(metadata,'utf8'));assert.equal(state.url,'http://127.0.0.1:'+port);
 assert.equal(JSON.parse(await fs.readFile(path.join(root,'server-port.json'),'utf8')).port,port);
 await fs.writeFile(metadata,JSON.stringify({...state,reuseMarker:true}));
 const again=await invoke();assert(!again.stdout.includes('stopped'));assert.equal(JSON.parse(await fs.readFile(metadata,'utf8')).reuseMarker,true);
 await fs.rm(path.join(root,'server-port.json'));await invoke();
 assert.equal(JSON.parse(await fs.readFile(path.join(root,'server-port.json'),'utf8')).port,port);
 console.log('PASS: concurrent/repeated Start reuses one installation; an older random-port server is adopted as the saved fixed address.');
 await invoke(['--restart']);state=JSON.parse(await fs.readFile(metadata,'utf8'));assert.equal(state.url,'http://127.0.0.1:'+port);assert(!state.reuseMarker);
 await invoke(['--stop']);await invoke();assert.equal(JSON.parse(await fs.readFile(metadata,'utf8')).url,state.url);
 if(process.platform==='win32'){
  const repo=fileURLToPath(new URL('../',import.meta.url)),arch=process.arch==='arm64'?'arm64':'x64';
  const bundled=path.join(repo,'runtime','win-'+arch,'node.exe');
  if(await fs.access(bundled).then(()=>true,()=>false)){
   const starter=async name=>execute(process.env.ComSpec,['/d','/s','/c','""'+path.join(repo,name)+'""'],{env,windowsHide:true,windowsVerbatimArguments:true,timeout:25000});
   await fs.writeFile(metadata,JSON.stringify({...state,reuseMarker:true}));
   const opened=await starter('Start (Windows).cmd');assert(!opened.stdout.includes('stopped'));
   assert.equal(JSON.parse(await fs.readFile(metadata,'utf8')).reuseMarker,true);
   const restarted=await starter('Restart (Windows).cmd');assert(restarted.stdout.includes('stopped'));
   assert.equal(JSON.parse(await fs.readFile(metadata,'utf8')).url,state.url);
   console.log('PASS: actual Windows Start and Restart files reuse/restart disposable data with the bundled Node runtime.');
  }
 }
 await assert.rejects(()=>invoke(['--port','0']),/Command failed/);await assert.rejects(()=>invoke(['--surprise']),/Command failed/);
 const otherPort=await freePort();await assert.rejects(()=>invoke(['--port',String(otherPort)]),error=>/--restart --port/.test(error.stderr));
 await invoke(['--restart','--port',String(otherPort)]);state=JSON.parse(await fs.readFile(metadata,'utf8'));assert.equal(state.url,'http://127.0.0.1:'+otherPort);
 console.log('PASS: Restart/Stop preserve the bookmark; an explicit new port is validated, saved and requires Restart while running.');
 const request=(method,body,origin=state.url)=>fetch(state.url+'/api/startup',{method,headers:{Origin:origin,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
 assert.deepEqual(await(await request('GET')).json(),{supported:['win32','darwin'].includes(process.platform),enabled:false});
 assert.equal((await request('PATCH',{enabled:true},'http://example.com')).status,403);
 assert.equal((await request('PATCH',{enabled:'yes'})).status,400);
 // On Windows, this creates only a temporary shortcut; it is never registered
 // in the real user's Startup folder. Its exact encoded login command is tested.
 if(process.platform==='win32'){
  const enabled=await request('PATCH',{enabled:true});assert.equal(enabled.status,200,await enabled.clone().text());assert.equal((await enabled.json()).enabled,true);
  const registration=startupRegistration(options),ps=value=>"'"+value.replaceAll("'","''")+"'";
  const powershell=path.join(process.env.SystemRoot,'System32','WindowsPowerShell','v1.0','powershell.exe');
  const inspect="$s=(New-Object -ComObject WScript.Shell).CreateShortcut("+ps(registration.file)+"); @{target=$s.TargetPath;args=$s.Arguments} | ConvertTo-Json -Compress";
  const {stdout}=await execute(powershell,['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(inspect,'utf16le').toString('base64')],{windowsHide:true});
  const shortcut=JSON.parse(stdout),encoded=shortcut.args.split(' ').at(-1);
  const command=Buffer.from(encoded,'base64').toString('utf16le');assert(command.includes("'--background'"));assert(!command.includes('--restart'));
  await invoke(['--stop']);
  await execute(shortcut.target,['-NoProfile','-NonInteractive','-WindowStyle','Hidden','-EncodedCommand',encoded],{env,windowsHide:true,timeout:25000});
  await until(async()=>{try{return(await fetch(state.url+'/api/health')).ok;}catch{return false;}});
  assert.equal((await(await request('GET')).json()).enabled,true);
  assert.equal((await request('PATCH',{enabled:false})).status,200);assert.equal((await readStartup(options)).enabled,false);
  assert.deepEqual(JSON.parse(await fs.readFile(settings,'utf8')),{schemaVersion:1,exportLanguage:'en'});
  console.log('PASS: same-origin Settings enables/disables an isolated Windows shortcut; its actual silent login command starts the saved address, including paths with apostrophes, spaces and &.');
 }
 // Verify macOS registration data without activating launchd on the host.
 const mac={...options,platform:'darwin'};assert.equal((await readStartup(mac)).enabled,false);
 await saveStartup(true,mac);const plist=await fs.readFile(startupRegistration(mac).file,'utf8');
 assert(plist.includes('<key>RunAtLoad</key><true/>'));assert(plist.includes('<string>--foreground</string>'));assert(!plist.includes('KeepAlive'));assert(plist.includes('&apos;'));assert(plist.includes('&amp;'));
 await saveStartup(false,mac);assert.equal((await readStartup(mac)).enabled,false);
 assert.equal((await readStartup({...options,platform:'linux'})).supported,false);
 await invoke(['--stop']);
 const attached=invoke(['--background','--foreground']);
 await until(async()=>{try{return(await fetch(state.url+'/api/health')).ok;}catch{return false;}});
 await invoke(['--stop']);await attached;
 console.log('PASS: macOS LaunchAgent payload is escaped, removable and does not respawn after Stop; foreground supervision exits with the server. Actual macOS login remains untested.');
}finally{
 if(blocker?.listening)await new Promise(resolve=>blocker.close(resolve));
 await invoke(['--stop']).catch(()=>{});
 await fs.rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
