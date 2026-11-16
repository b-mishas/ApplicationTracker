// Local launcher settings are separate from portable export preferences.
import net from 'node:net';
import fs from 'node:fs/promises';
import path from 'node:path';
import {dataRoot} from './config.mjs';
import {writeJsonAtomic,withLock,revision,ConflictError} from './store.mjs';
export function validatePort(value){
 if(!['number','string'].includes(typeof value)||!/^\d+$/.test(String(value))||!Number.isInteger(Number(value))||Number(value)<1024||Number(value)>65535)throw Error('Choose a whole port number from 1024 to 65535.');
 return Number(value);
}
export async function readStoredPort(root=dataRoot){
 let raw='';try{raw=await fs.readFile(path.join(root,'server-port.json'),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;}
 let port;try{if(raw)port=validatePort(JSON.parse(raw).port);}catch{ /* Damaged file: use the default port. */ }
 return {port,revision:revision(raw)};
}
export function configuredPort(stored,currentPort,env=process.env){return validatePort(env.JOBTRACKER_PORT??stored.port??currentPort??8765);}
export async function assertPortAvailable(value,currentPort){
 const port=validatePort(value);if(port===currentPort)return;
 const listener=net.createServer();
 await new Promise((resolve,reject)=>{
  listener.once('error',error=>{
   if(error.code==='EADDRINUSE'){error.message='Port '+port+' (http://127.0.0.1:'+port+') is already in use. Choose another port; the current server has not been stopped.';}
   reject(error);
  });
  listener.listen({port,host:'127.0.0.1',exclusive:true},()=>listener.close(resolve));
 });
}
export async function readPortSettings(currentPort,{root=dataRoot,env=process.env}={}){
 const stored=await readStoredPort(root),port=configuredPort(stored,currentPort,env);
 return {port,currentPort,currentUrl:'http://127.0.0.1:'+currentPort,pending:port!==currentPort,revision:stored.revision,controlledByEnvironment:env.JOBTRACKER_PORT!==undefined};
}
export async function savePortSettings(value,expectedRevision,currentPort,{root=dataRoot,env=process.env}={}){
 const port=validatePort(value),logs=path.join(root,'logs');
 if(env.JOBTRACKER_PORT!==undefined)throw Error('The port is controlled by JOBTRACKER_PORT. Change or remove that override first.');
 await fs.mkdir(logs,{recursive:true});
 return withLock(logs,async()=>{
  const stored=await readStoredPort(root);
  if(!expectedRevision||stored.revision!==expectedRevision)throw new ConflictError('Local port changed. Reopen Settings before saving.');
  await assertPortAvailable(port,currentPort);
  await writeJsonAtomic(path.join(root,'server-port.json'),{port});
  return readPortSettings(currentPort,{root,env});
 });
}
