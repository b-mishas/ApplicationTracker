// Exercise pending port changes and starter recovery without touching real data.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import assert from 'node:assert/strict';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const execute=promisify(execFile),launcher=fileURLToPath(new URL('./launch.mjs',import.meta.url));
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'tracker-port-settings-'));
const env={...process.env,JOBTRACKER_DATA_DIR:temp,JOBTRACKER_SETTINGS_FILE:path.join(temp,'settings.json'),JOBTRACKER_NO_BROWSER:'1'};
delete env.JOBTRACKER_PORT;
const metadata=path.join(temp,'logs','server.json'),portFile=path.join(temp,'server-port.json');
const launch=args=>execute(process.execPath,[launcher,...args],{env,windowsHide:true,timeout:25000});
async function bind(port=0){const server=net.createServer();await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});return server;}
const close=server=>new Promise(resolve=>server.close(resolve));
async function freePort(){const server=await bind(),port=server.address().port;await close(server);return port;}
let address,blocker,prompt;
const snapshot=async()=>JSON.parse(await fs.readFile(portFile,'utf8'));
const config=async()=>{const response=await fetch(address+'/api/port-settings');assert.equal(response.status,200);return response.json();};
const patch=(body,origin=address)=>fetch(address+'/api/port-settings',{method:'PATCH',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
function interactive(){
 const child=spawn(process.execPath,[launcher,'--interactive'],{env,windowsHide:true,stdio:['pipe','pipe','pipe']});
 let stdout='',stderr='';child.stdout.on('data',chunk=>stdout+=chunk);child.stderr.on('data',chunk=>stderr+=chunk);
 const result=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',code=>resolve({code,stdout,stderr}));});
 return {child,result,output:()=>stdout};
}
const until=async fn=>{for(let i=0;i<150;i++){if(await fn())return;await new Promise(resolve=>setTimeout(resolve,25));}throw Error('Timed out waiting for prompt');};
try{
 const initial=await freePort();await launch(['--port',String(initial)]);address='http://127.0.0.1:'+initial;
 let state=await config();assert.equal(state.currentPort,initial);assert.equal(state.port,initial);assert(!state.pending);
 assert.equal((await patch({port:initial,revision:state.revision},'http://example.com')).status,403);
 for(const port of [0,1023,65536,1.5,'abc',null,true])assert.equal((await patch({port,revision:state.revision})).status,400);
 assert.equal((await patch({port:initial,revision:'stale'})).status,409);
 blocker=await bind();const occupied=blocker.address().port,before=await snapshot();
 const failed=await patch({port:occupied,revision:state.revision});assert.equal(failed.status,400);assert.match((await failed.json()).error,/already in use/);
 assert.deepEqual(await snapshot(),before);assert((await fetch(address+'/api/health')).ok);
 console.log('PASS: port API validates numbers/origins/revisions and rejects occupied ports without changing files or stopping the server.');
 const chosen=await freePort();const saved=await patch({port:chosen,revision:state.revision});assert.equal(saved.status,200);state=await saved.json();
 assert(state.pending);assert.equal(state.currentUrl,address);assert.equal(state.port,chosen);assert((await fetch(address+'/api/health')).ok);
 await launch([]);assert.equal((await config()).port,chosen);assert.equal(JSON.parse(await fs.readFile(metadata,'utf8')).url,address);
 await close(blocker);blocker=await bind(chosen);
 await assert.rejects(()=>launch(['--restart']),error=>/already in use/.test(error.stderr)&&!error.stdout.includes('stopped'));
 assert((await fetch(address+'/api/health')).ok);assert.equal((await snapshot()).port,chosen);
 await close(blocker);blocker=undefined;await launch(['--restart']);address='http://127.0.0.1:'+chosen;assert((await fetch(address+'/api/health')).ok);assert(!(await config()).pending);
 assert.deepEqual(JSON.parse(await fs.readFile(env.JOBTRACKER_SETTINGS_FILE,'utf8')),{schemaVersion:1,exportLanguage:'en'});
 console.log('PASS: Save stages the next address, Start reuses the old address, and Restart checks availability before stopping; successful Restart applies the saved port.');
 await launch(['--stop']);blocker=await bind();const blockedPort=blocker.address().port;await fs.writeFile(portFile,JSON.stringify({port:blockedPort}));
 await assert.rejects(()=>launch(['--interactive','--background']),error=>!error.stdout.includes('Enter another port'));
 prompt=interactive();await until(()=>prompt.output().includes('Enter another port'));
 // The starter must release its lock while waiting, even if someone closes it.
 await launch(['--stop']);
 prompt.child.stdin.write('\n');let result=await prompt.result;assert.equal(result.code,1);assert.match(result.stderr,/cancelled/);assert.equal((await snapshot()).port,blockedPort);
 prompt=interactive();await until(()=>prompt.output().includes('Enter another port'));
 prompt.child.stdin.write('invalid\n');await until(()=>prompt.output().includes('Choose a whole port'));
 const recovered=await freePort();prompt.child.stdin.end(String(recovered)+'\n');result=await prompt.result;assert.equal(result.code,0,result.stderr);address='http://127.0.0.1:'+recovered;
 assert((await fetch(address+'/api/health')).ok);assert.equal((await snapshot()).port,recovered);
 console.log('PASS: interactive conflict recovery validates input, supports cancellation without changes, releases its lock while waiting and saves the selected address; background launches never prompt.');
 const controlled=await import('./port-settings.mjs');
 assert.equal((await controlled.readPortSettings(recovered,{root:temp,env:{JOBTRACKER_PORT:String(recovered)}})).controlledByEnvironment,true);
 const finalState=await config();
 await assert.rejects(()=>controlled.savePortSettings(initial,finalState.revision,recovered,{root:temp,env:{JOBTRACKER_PORT:String(recovered)}}),/controlled by JOBTRACKER_PORT/);
 console.log('PASS: JOBTRACKER_PORT overrides are visible and protected; export settings remain unchanged.');
}finally{
 if(prompt?.child.exitCode===null)prompt.child.kill();
 if(blocker?.listening)await close(blocker);
 await launch(['--stop']).catch(()=>{});
 await fs.rm(temp,{recursive:true,force:true,maxRetries:10,retryDelay:100});
}
