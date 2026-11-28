// Shared field definitions keep the browser form and server validation in agreement.
import {STATUS_VALUES, effectiveStatus, interviewDetails, interviewHistoryText, updateStage, validStageDate, StatusHistoryError} from './status-history.mjs';

export const entryFields = [
 ['company','Company','text','Position',200], ['title','Position','text','Position',300],
 ['group','Group','text','Position',200], ['fit','Fit','fit','Position'],
 ['url','Primary listing URL','url','Position',2000], ['linkType','Link type',['posting','search'],'Position'],
 ['reasoning','Why it fits','textarea','Assessment',50000], ['gaps','Gaps','textarea','Assessment',50000],
 ['assessmentBasis','Assessment',['Title only','Posting reviewed'],'Assessment'],
 ['seniority','Seniority','text','Assessment',300],
 ['city','City','text','Location',200], ['countries','Countries (codes separated by commas)','countries','Location'],
 ['locationRaw','Location','text','Location',1000],
 ['workMode','Work mode',['On-site','Hybrid','Remote','Unknown'],'Location'], ['workModeRaw','Work mode as recorded','text','Location',500],
 ['firstSeen','First found','date','Location'], ['postedDate','Posted','date','Location'],
 ['applicationDeadline','Deadline','date','Location'],
 ['status','Status',STATUS_VALUES,'Application'], ['urgent','Urgent','boolean','Application'],
 ['applicationDate','Application date','date','Application'], ['interviewDate','Interview date','date','Application'],
 ['offerDate','Offer date','date','Application'], ['interviewOutcomeDate','Rejection / withdrawal date','date','Application'],
 ['applicationStatusText','Application status text','text','Application',2000],
 ['notes','Notes','textarea','Application',50000],
 ['provider','Provider','text','Advanced',60], ['providerJobId','Provider job ID','text','Advanced',200]
];
export const readOnlyFields = new Set(['id','updatedAt','createdAt','lastSeen','observedAt','otherIds','postingUrls','country','interviewOutcome','dismissedFromStatus','applicationSourceRow','applicationCity','lastObservedAt','assessedAt','workModeBasis','workModeAt','applicationDeadlineAt','availabilityAt','availability','statusHistory']);
const unsafeKeys = new Set(['__proto__','prototype','constructor']);
const known = new Map(entryFields.map(field=>[field[0],field]));
export function fieldLabel(key){
 if(known.has(key))return known.get(key)[1];
 const text=key.replace(/([A-Z]+)([A-Z][a-z])/g,'$1 $2').replace(/([a-z0-9])([A-Z])/g,'$1 $2').replace(/[_-]+/g,' ').toLowerCase().replace(/\b(id|url|api|json)\b/g,word=>word.toUpperCase());
 return text.charAt(0).toUpperCase()+text.slice(1);
}
export function fieldsFor(job){
 const extra=Object.keys(job).filter(key=>!known.has(key)&&key!=='sources'&&!readOnlyFields.has(key)&&!unsafeKeys.has(key));
 return [...entryFields,...extra.map(key=>[key,fieldLabel(key),typeof job[key]==='boolean'?'boolean':typeof job[key]==='string'?'textarea':'json','Advanced'])];
}
export function displayValue(job,key){
 if(key==='status')return effectiveStatus(job);
 if(['interviewDate','offerDate','interviewOutcomeDate'].includes(key))return interviewDetails(job)[key];
 if(key==='applicationStatusText')return job.applicationStatusText??interviewHistoryText(job);
 return job[key];
}
export function formValue(job,key,type){
 const value=displayValue(job,key);
 if(type==='countries')return (value||[]).join(', ');
 if(type==='json')return value===undefined?'':JSON.stringify(value,null,2);
 return value??'';
}
// Convert raw form values once so browser extraction and data rules agree.
export function parseEntryValue(key,type,raw){
 let value=raw;
 if(type==='countries')value=raw.split(',').map(code=>code.trim().toUpperCase()).filter(Boolean);
 if(type==='fit')value=raw===''?null:Number(raw);
 if(type==='json'){try{value=JSON.parse(raw);}catch{throw new StatusHistoryError(`${key}: enter valid JSON.`);}}
 return value;
}
function fail(key,message){throw new StatusHistoryError(`${key}: ${message}`);}
function httpUrl(value){try{return ['http:','https:'].includes(new URL(value).protocol);}catch{return false;}}
const valueKind=value=>value===null?'null':Array.isArray(value)?'array':typeof value;
export function validateEntryChanges(job,changes,{isCountryCode=code=>/^[A-Z]{2}$/.test(code)}={}){
 if(!changes||typeof changes!=='object'||Array.isArray(changes))fail('changes','expected an object.');
 const definitions=new Map(fieldsFor(job).map(field=>[field[0],field]));
 for(const [key,value] of Object.entries(changes)){
  if(unsafeKeys.has(key)||readOnlyFields.has(key))fail(key,'this field is read-only.');
  if(key==='sources'){
   if(!Array.isArray(value)||value.length>100)fail(key,'expected up to 100 listing URLs.');
   for(const source of value){
    if(!source||typeof source!=='object'||Array.isArray(source))fail(key,'invalid source.');
    if(Object.hasOwn(source,'linkType')&&!['posting','search'].includes(source.linkType))fail(key,'link type must be posting or search.');
    if(typeof source.label!=='string'||!source.label.trim()||source.label.length>200||typeof source.url!=='string'||source.url.length>2000||!(httpUrl(source.url)||source.url===''&&(job.sources||[]).some(old=>old.url===''&&old.file===source.file))||typeof source.file!=='string'||source.file.length>300)fail(key,'each source needs a label and an http(s) URL; evidence file is optional.');
   }
   continue;
  }
  const definition=definitions.get(key);if(!definition)fail(key,'unknown field.');
  const [, ,type,,limit]=definition;
  if(Array.isArray(type)){if(!type.includes(value))fail(key,'choose a listed value.');}
  else if(type==='fit'){if(value!==null&&(!Number.isInteger(value)||value<1||value>5))fail(key,'choose 1–5 or Unknown.');}
  else if(type==='boolean'){if(typeof value!=='boolean')fail(key,'expected true or false.');}
  else if(type==='countries'){
   if(!Array.isArray(value)||value.length>50||new Set(value).size!==value.length||value.some(code=>typeof code!=='string'||!isCountryCode(code)))fail(key,'enter unique supported country codes.');
  }else if(type==='json'){
   if(valueKind(job[key])!==valueKind(value))fail(key,'keep the existing value type.');
  }else{
   if(typeof value!=='string'||value.length>(limit||50000))fail(key,'invalid or too long.');
   if(['company','title'].includes(key)&&!value.trim())fail(key,'cannot be empty.');
   if(type==='date'&&!validStageDate(value))fail(key,'enter a calendar date or leave empty.');
   if(type==='url'&&value!==''&&!httpUrl(value))fail(key,'enter an http(s) URL.');
  }
 }
}
export function applyEntryChanges(job,changes,today,options){
 validateEntryChanges(job,changes,options);
 const previous=structuredClone(job),oldStatus=effectiveStatus(job);
 const primary=(changes.sources??job.sources??[]).find(source=>source.url===(changes.url??job.url));
 if(primary?.linkType&&['sources','url','linkType'].some(key=>Object.hasOwn(changes,key))){
  if(Object.hasOwn(changes,'linkType')&&changes.linkType!==primary.linkType)fail('linkType','must match the primary source.');
  changes={...changes,linkType:primary.linkType};
 }
 const stageKeys=['status','applicationDate','interviewDate','offerDate','interviewOutcomeDate'];
 if(stageKeys.some(key=>Object.hasOwn(changes,key)))updateStage(job,{...changes,status:changes.status??oldStatus},today);
 // Date corrections are independent of the current stage. Only a real stage
 // transition applies the existing automatic milestone reset/prefill rules.
 if(effectiveStatus(job)===oldStatus){
  for(const key of stageKeys.slice(1))if(Object.hasOwn(changes,key))job[key]=changes[key];
 }
 for(const [key,value] of Object.entries(changes))if(!stageKeys.includes(key))job[key]=structuredClone(value);
 if(Object.hasOwn(changes,'countries'))job.country=job.countries.join(', ');
 if(!Object.hasOwn(changes,'applicationStatusText')&&(oldStatus!==effectiveStatus(job)||previous.applicationDate!==job.applicationDate||JSON.stringify(interviewDetails(previous))!==JSON.stringify(interviewDetails(job))))delete job.applicationStatusText;
 if(oldStatus!==effectiveStatus(job)&&job.status==='Dismissed')job.dismissedFromStatus=oldStatus;
 if(oldStatus!==effectiveStatus(job)&&previous.status==='Dismissed')delete job.dismissedFromStatus;
}

// Infer only recognizable URL shapes. Other links need an explicit user choice.
export function inferredLinkType(value){
 try{
  const url=new URL(value),host=url.hostname.replace(/^www\./,'');
  if(host==='linkedin.com'){
   if(/^\/jobs\/search(?:\/|$)/.test(url.pathname))return 'search';
   if(/^\/jobs\/view\//.test(url.pathname))return 'posting';
  }
  return null;
 }catch{return null;}
}
