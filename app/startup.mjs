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
 return {supported:supported&&Boolean(directory),platform,label,file,executable,launch,data,settings};
}
export async function readStartup(options){
 const registration=startupRegistration(options);
 let enabled=false;
 if(registration.supported){try{await fs.access(registration.file);enabled=true;}catch(error){if(error.code!=='ENOENT')throw error;}}
 return {supported:registration.supported,enabled};
}
export async function saveStartup(enabled,options){
 if(typeof enabled!=='boolean')throw Error('Start at login must be true or false.');
 const r=startupRegistration(options);
 if(!r.supported)throw Error('Automatic startup is available on Windows and macOS.');
 if(!enabled){await fs.rm(r.file,{force:true});return readStartup(options);}
 await fs.access(r.executable);await fs.access(r.launch);
 await fs.mkdir(path.dirname(r.file),{recursive:true});
 if(r.platform==='win32'){
  // A hidden PowerShell shortcut avoids a terminal window at login. Values are
  // quoted as literals; folder names containing spaces, apostrophes or & work.
  const command=["$env:JOBTRACKER_DATA_DIR="+ps(r.data),"$env:JOBTRACKER_SETTINGS_FILE="+ps(r.settings),"& "+ps(r.executable)+' '+ps(r.launch)+" '--background'"].join('; ');
  const encoded=Buffer.from(command,'utf16le').toString('base64');
  const powershell=path.join(process.env.SystemRoot||'C:/Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  const script=["$ErrorActionPreference='Stop'","$shell=New-Object -ComObject WScript.Shell","$shortcut=$shell.CreateShortcut("+ps(r.file)+')',"$shortcut.TargetPath="+ps(powershell),"$shortcut.Arguments="+ps('-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand '+encoded),"$shortcut.WorkingDirectory="+ps(path.dirname(r.launch)),"$shortcut.WindowStyle=7","$shortcut.Description='Application tracker background server'","$shortcut.Save()"].join('; ');
  await run(powershell,['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{windowsHide:true,timeout:15000});
 }else{
  // RunAtLoad runs once at login. No KeepAlive: Stop must stay stopped.
  const args=[r.executable,r.launch,'--background','--foreground'].map(value=>'<string>'+xml(value)+'</string>').join('');
  const contents='<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>'+r.label+'</string><key>ProgramArguments</key><array>'+args+'</array><key>RunAtLoad</key><true/><key>EnvironmentVariables</key><dict><key>JOBTRACKER_DATA_DIR</key><string>'+xml(r.data)+'</string><key>JOBTRACKER_SETTINGS_FILE</key><string>'+xml(r.settings)+'</string></dict><key>StandardOutPath</key><string>'+xml(path.join(r.data,'logs','login.log'))+'</string><key>StandardErrorPath</key><string>'+xml(path.join(r.data,'logs','login.log'))+'</string></dict></plist>\n';
  await fs.writeFile(r.file,contents,{mode:0o600});
 }
 return readStartup(options);
}
