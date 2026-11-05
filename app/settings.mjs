import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {writeJsonAtomic,revision,withLock} from './store.mjs';

export const settingsFile=process.env.JOBTRACKER_SETTINGS_FILE||fileURLToPath(new URL('../settings/tracker.json',import.meta.url));
export const defaults={schemaVersion:1,groups:[],countries:[],timezone:'',exportLanguage:'en'};
export const countryCodes=JSON.parse(await fs.readFile(new URL('./countries.json',import.meta.url),'utf8'));
export function validateSettings(s){
 const errors=[];
 if(!s||typeof s!=='object'||Array.isArray(s))throw Error('Settings must be a JSON object.');
 for(const key of Object.keys(s))if(!(key in defaults))errors.push(`Unknown setting: ${key}`);
 if(s.schemaVersion!==1)errors.push('schemaVersion must be 1.');
 for(const key of ['groups','countries']){
  const values=s[key];
  if(!Array.isArray(values)||values.length>300||values.some(v=>typeof v!=='string'||!v.trim()||v!==v.trim()||v.length>100))errors.push(`${key} must be an array of unique nonempty names (no surrounding spaces).`);
  else if(new Set(values).size!==values.length)errors.push(`${key} contains duplicates.`);
 }
 if(Array.isArray(s.countries)&&s.countries.some(v=>!/^[A-Z]{2}$/.test(v)))errors.push('countries must use uppercase two-letter codes (GB preferred; UK accepted).');
 if(Array.isArray(s.countries)&&s.countries.some(v=>!countryCodes.includes(v==='UK'?'GB':v)))errors.push('Unsupported country code. Use a code listed in app/countries.json.');
 if(typeof s.timezone!=='string')errors.push('timezone must be an IANA name or an empty string.');
 else if(s.timezone){try{new Intl.DateTimeFormat('en',{timeZone:s.timezone});}catch{errors.push('Unknown timezone. Use an IANA name such as America/New_York.');}}
 if(!['en','de'].includes(s.exportLanguage))errors.push('exportLanguage must be en or de.');
 if(errors.length)throw Error(errors.join('\n'));
 return structuredClone(s);
}
export function ready(s){return Boolean(s.timezone&&s.groups.length&&s.countries.length);}
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
export function calendarDate(iso,timezone='UTC'){
 const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso)).map(p=>[p.type,p.value]));
 return `${p.year}-${p.month}-${p.day}`;
}
