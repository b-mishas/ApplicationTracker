import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeJsonAtomic,revision,withLock} from './store.mjs';

export const settingsFile=process.env.JOBTRACKER_SETTINGS_FILE||fileURLToPath(new URL('../settings/tracker.json',import.meta.url));
export const defaults={schemaVersion:1,exportLanguage:'en'};
export const countryCodes=JSON.parse(await fs.readFile(new URL('./countries.json',import.meta.url),'utf8'));
export function isCountryCode(code){return typeof code==='string'&&/^[A-Z]{2}$/.test(code)&&countryCodes.includes(code==='UK'?'GB':code)&&!['UN','XX'].includes(code);}
export function validateSettings(s){
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Settings must be a JSON object.');
 // Older installations may still contain the retired search/time settings.
 // Read them without requiring a migration; the next explicit save drops them.
 const allowed=new Set([...Object.keys(defaults),'exportName','groups','countries','timezone']);
 const errors=[];
 for(const key of Object.keys(s))if(!allowed.has(key))errors.push('Unknown setting: '+key);
 if(s.schemaVersion!==1)errors.push('schemaVersion must be 1.');
 if(!['en','de'].includes(s.exportLanguage))errors.push('exportLanguage must be en or de.');
 const exportName=typeof s.exportName==='string'?s.exportName.trim():'';
 if(Object.hasOwn(s,'exportName')&&(typeof s.exportName!=='string'||exportName.length>100||/[\u0000-\u001f\u007f]/.test(exportName)))errors.push('Name must be a single line of up to 100 characters.');
 if(errors.length)throw Error(errors.join('\n'));
 return {schemaVersion:1,exportLanguage:s.exportLanguage,...(exportName?{exportName}:{})};
}
// Retained for older CLI/API callers: valid defaults are ready immediately.
export function ready(s){try{validateSettings(s);return true;}catch{return false;}}
export async function readSettings(file=process.env.JOBTRACKER_SETTINGS_FILE||settingsFile){
 try{return validateSettings(JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,'')));}
 catch(e){throw Error(`Cannot load settings (${file}): ${e.message}`);}
}
export async function saveSettings(value,expectedRevision){
 const next=validateSettings(value);
 await fs.mkdir(path.dirname(settingsFile),{recursive:true});
 // Serialize changes independently of inventory writes and reject stale Settings screens.
 return withLock(path.dirname(settingsFile),async()=>{
  const old=await fs.readFile(settingsFile,'utf8');
  if(!expectedRevision||revision(old)!==expectedRevision)throw Error('Settings changed. Reload the page before saving.');
  await fs.mkdir(path.join(path.dirname(settingsFile),'backups'),{recursive:true});
  await fs.writeFile(path.join(path.dirname(settingsFile),'backups',`tracker-${Date.now()}.json`),old,{flag:'wx'});
  await writeJsonAtomic(settingsFile,next);
  return {settings:next,revision:revision(await fs.readFile(settingsFile,'utf8'))};
 });
}
export function calendarDate(iso,timezone){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{...(timezone?{timeZone:timezone}:{}),year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
