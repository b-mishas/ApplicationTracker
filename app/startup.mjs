// Per-user login registration belongs to this installation, not to the search agent.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import {dataRoot} from './config.mjs';
import {settingsFile} from './settings.mjs';
import {writeJsonAtomic} from './store.mjs';
const run=promisify(execFile);
const launcher=fileURLToPath(new URL('./launch.mjs',import.meta.url));
const ps=value=>"'"+String(value).replaceAll("'","''")+"'";
const xml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
export function startupRegistration({platform=process.platform,home=os.homedir(),appData=process.env.APPDATA,executable=process.execPath,launch=launcher,data=dataRoot,settings=settingsFile}={}){
 const id=crypto.createHash('sha256').update(launch+'\0'+data).digest('hex').slice(0,16);
 const supported=['win32','darwin'].includes(platform);
 const label='local.applicationtracker.'+id;
 const directory=platform==='win32'?appData&&path.join(appData,'Microsoft','Windows','Start Menu','Programs','Startup'):path.join(home,'Library','LaunchAgents');
 const file=directory&&path.join(directory,platform==='win32'?'ApplicationTracker-'+id+'.lnk':label+'.plist');
 // Outside the Startup folder, where Windows would open every file at login.
 const registry=platform==='win32'?appData&&path.join(appData,'ApplicationTracker','login-entries.json'):path.join(home,'Library','Application Support','ApplicationTracker','login-entries.json');
 return {supported:supported&&Boolean(directory),platform,label,file,executable,launch,data,settings,registry};
}
// The registry maps each login entry to the launcher it starts, so entries of moved or deleted folders can be removed.
async function loginEntries(r){try{const all=JSON.parse(await fs.readFile(r.registry,'utf8'));return all&&typeof all==='object'&&!Array.isArray(all)?all:{};}catch{return {};}}
async function remember(r,keep){
 const all=await loginEntries(r);if(keep)all[r.file]=r.launch;else delete all[r.file];
 await fs.mkdir(path.dirname(r.registry),{recursive:true});await writeJsonAtomic(r.registry,all);
}
export async function removeStaleStartup(options){
 const r=startupRegistration(options);if(!r.supported)return;
 const all=await loginEntries(r);let changed=false;
 for(const [file,launch] of Object.entries(all)){
  if(typeof launch==='string'&&await fs.access(launch).then(()=>true,()=>false))continue;
  // Delete only this app's own entries in the login folder, whatever the registry file says.
  if(path.dirname(file)===path.dirname(r.file)&&/^(?:ApplicationTracker-[0-9a-f]{16}\.lnk|local\.applicationtracker\.[0-9a-f]{16}\.plist)$/.test(path.basename(file)))await fs.rm(file,{force:true});
  delete all[file];changed=true;
 }
 if(changed)await writeJsonAtomic(r.registry,all);
}
export async function readStartup(options){
 const registration=startupRegistration(options);
 let enabled=false;
 if(registration.supported){try{await fs.access(registration.file);enabled=true;}catch(error){if(error.code!=='ENOENT')throw error;}}
 return {supported:registration.supported,enabled,offered:registration.supported&&registration.platform==='win32'};
}
export async function saveStartup(enabled,options){
 if(typeof enabled!=='boolean')throw Error('Start at login must be true or false.');
 const r=startupRegistration(options);
 if(!r.supported)throw Error('Automatic startup is available on Windows and macOS.');
 if(!enabled){await fs.rm(r.file,{force:true});await remember(r,false);return readStartup(options);}
 await fs.access(r.executable);await fs.access(r.launch);
 await fs.mkdir(path.dirname(r.file),{recursive:true});
 if(r.platform==='win32'){
  // A hidden PowerShell shortcut avoids a terminal window at login. Values are
  // quoted as literals; folder names containing spaces, apostrophes or & work.
  // Folders next to app/ are the launcher's defaults and need no override.
  const beside=name=>path.resolve(path.dirname(r.launch),'..',name);
  const command=[...(path.resolve(r.data)===beside('data')?[]:["$env:JOBTRACKER_DATA_DIR="+ps(r.data)]),...(path.resolve(r.settings)===beside(path.join('settings','tracker.json'))?[]:["$env:JOBTRACKER_SETTINGS_FILE="+ps(r.settings)]),"& "+ps(r.executable)+' '+ps(r.launch)+" '--background'"].join('; ');
  const encoded=Buffer.from(command,'utf16le').toString('base64');
  const powershell=path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  // Windows silently cuts shortcut arguments at 1023 characters, which would leave a broken login command.
  if(('-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand '+encoded).length>1023)throw Error('The Application tracker folder path is too long for automatic startup. Move the folder to a shorter path, for example directly into Documents.');
  const script=["$ErrorActionPreference='Stop'","$shell=New-Object -ComObject WScript.Shell","$shortcut=$shell.CreateShortcut("+ps(r.file)+')',"$shortcut.TargetPath="+ps(powershell),"$shortcut.Arguments="+ps('-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand '+encoded),"$shortcut.WorkingDirectory="+ps(path.dirname(r.launch)),"$shortcut.WindowStyle=7","$shortcut.Description='Application tracker background server'","$shortcut.Save()"].join('; ');
  await run(powershell,['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:15000});
 }else{
  // RunAtLoad runs once at login. No KeepAlive: Stop must stay stopped.
  const args=[r.executable,r.launch,'--background','--foreground'].map(value=>'<string>'+xml(value)+'</string>').join('');
  const contents='<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>'+r.label+'</string><key>ProgramArguments</key><array>'+args+'</array><key>RunAtLoad</key><true/><key>EnvironmentVariables</key><dict><key>JOBTRACKER_DATA_DIR</key><string>'+xml(r.data)+'</string><key>JOBTRACKER_SETTINGS_FILE</key><string>'+xml(r.settings)+'</string></dict><key>StandardOutPath</key><string>'+xml(path.join(r.data,'logs','login.log'))+'</string><key>StandardErrorPath</key><string>'+xml(path.join(r.data,'logs','login.log'))+'</string></dict></plist>\n';
  await fs.writeFile(r.file,contents,{mode:0o600});
 }
 await remember(r,true);
 return readStartup(options);
}
