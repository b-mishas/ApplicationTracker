// A dependency-free local server. Only listens on this computer.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {commit, revision, STATUSES, ConflictError, BusyError, writeJsonAtomic} from './store.mjs';
import {dataRoot} from './config.mjs';
import {readStartup,saveStartup} from './startup.mjs';
import {readSettings,settingsFile,saveSettings,ready,countryCodes,isCountryCode} from './settings.mjs';
import crypto from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {calendarDate} from './settings.mjs';
import {updateStage,validStageDate,validateMilestones,effectiveStatus,interviewDetails,StatusHistoryError} from './status-history.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
let port=Number(process.env.PORT??8765), origin=`http://127.0.0.1:${port}`;
const installation=crypto.createHash('sha256').update(root+'\0'+dataRoot).digest('hex');
class NotFound extends Error{}
const viewStateFile=path.join(dataRoot,'view-state.json');
const filterKeys=new Set(['fit','company','group','title','star','country','city','workMode','status','applicationDate','seniority','firstSeen','postedDate','assessmentBasis']);
let viewStateWrite=Promise.resolve();
// Keep one successful position edit available to the tab that made it.
let lastJobEdit;
async function readViewState(){
 try{
  const state=JSON.parse(await readFile(viewStateFile,'utf8'));
  return validViewState(state)?state:null;
 }
 catch(error){if(error.code==='ENOENT'||error instanceof SyntaxError)return null;throw error;}
}
function validViewLayout(layout){
 return layout&&Array.isArray(layout.columns)&&layout.columns.length<=filterKeys.size
  &&layout.columns.every(key=>filterKeys.has(key))&&new Set(layout.columns).size===layout.columns.length
  &&filterKeys.has(layout.sort)&&[1,-1].includes(layout.direction);
}
function validViewState(state){
 if(!state||typeof state.search!=='string'||state.search.length>2000||!Number.isSafeInteger(state.updatedAt)||state.updatedAt<0||!state.filters||typeof state.filters!=='object'||Array.isArray(state.filters))return false;
 const shortText=value=>typeof value==='string'&&value.length<=2000;
 return Object.entries(state.filters).every(([key,value])=>filterKeys.has(key)&&(shortText(value)||Array.isArray(value)&&value.length<=1000&&value.every(shortText)))
  &&[state.layout,state.standardLayout].every(layout=>layout===undefined||validViewLayout(layout));
}
const server=http.createServer(async(req,res)=>{
 const reply=(code,value,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(value):value);};
 try {
  if(req.headers.host!==`127.0.0.1:${port}`) return reply(403,{error:'Use the local address printed by the launcher.'});
  const url=new URL(req.url,origin);
  if(url.pathname==='/api/health'&&req.method==='GET')return reply(200,{app:'ApplicationTracker',installation});
  if(url.pathname==='/api/stop'&&req.method==='POST'){
   if(req.headers.origin!==origin)return reply(403,{error:'Stop from the local launcher.'});
   reply(200,{stopping:true});server.close();return;
  }
  if(url.pathname==='/api/view-state'&&req.method==='GET'){
   await viewStateWrite;
   return reply(200,await readViewState());
  }
  if(url.pathname==='/api/view-state'&&req.method==='POST'){
   if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json'))return reply(403,{error:'Save from the tracker page.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>50000)return reply(413,{error:'Filter state too large.'});}
   let state;
   try{state=JSON.parse(body);}catch{return reply(400,{error:'Invalid filter state.'});}
   if(!validViewState(state))return reply(400,{error:'Invalid filter state.'});
   const write=viewStateWrite.then(async()=>{
    const previous=await readViewState();
    if(!previous||state.updatedAt>=previous.updatedAt)await writeJsonAtomic(viewStateFile,state);
   });
   viewStateWrite=write.catch(()=>{});
   await write;
   return reply(200,{saved:true});
  }
  if(url.pathname==='/api/countries'&&req.method==='GET')return reply(200,countryCodes.filter(isCountryCode));
  if(url.pathname==='/api/startup'&&req.method==='GET')return reply(200,await readStartup());
  if(url.pathname==='/api/startup'&&req.method==='PATCH'){
   if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json'))return reply(403,{error:'Save from the tracker page.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>1000)return reply(413,{error:'Startup setting too large.'});}
   try{return reply(200,await saveStartup(JSON.parse(body).enabled));}catch(error){return reply(400,{error:error.message});}
  }
  if(url.pathname==='/api/settings'&&req.method==='GET'){const settings=await readSettings();return reply(200,{settings,revision:revision(await readFile(settingsFile,'utf8')),ready:ready(settings)});}
  if(url.pathname==='/api/settings'&&req.method==='PATCH'){
   if(req.headers.origin!==origin||!req.headers['content-type']?.startsWith('application/json'))return reply(403,{error:'Save from the tracker page.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)return reply(413,{error:'Settings too large.'});}
   try{const input=JSON.parse(body);return reply(200,await saveSettings(input.settings,input.revision));}catch(error){return reply(400,{error:error.message});}
  }
  if(url.pathname==='/export/applications/print' && req.method==='GET'){
   const {applicationExportData}=await import('./export-applications.mjs');
   const {applicationPrintPage}=await import('./print-applications.mjs');
   try{
    return reply(200,applicationPrintPage(await applicationExportData({root:dataRoot})),'text/html; charset=utf-8');
   }catch(error){
    if(error.code!=='EXPORT_INPUT')throw error;
    return reply(422,applicationPrintPage({error:error.message}),'text/html; charset=utf-8');
   }
  }
  if(url.pathname==='/api/export/applications.xlsx' && req.method==='GET'){
   const {exportApplications}=await import('./export-applications.mjs');
   try{
    const result=await exportApplications({root:dataRoot});
    res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':`attachment; filename="applications_${calendarDate(new Date())}.xlsx"`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(result.buffer);return;
   }catch(error){return reply(error.code==='EXPORT_INPUT'?422:503,{error:error.message});}
  }
  if(url.pathname==='/api/jobs' && req.method==='GET') {const raw=await readFile(path.join(dataRoot,'jobs.json'),'utf8');return reply(200,{data:JSON.parse(raw),revision:revision(raw)});}
  if(url.pathname==='/api/jobs' && req.method==='PATCH') {
   if(req.headers.origin!==origin || !req.headers['content-type']?.startsWith('application/json')) return reply(403,{error:'Save from the tracker page.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)return reply(413,{error:'Notes too large.'});}
   const input=JSON.parse(body);
   try{if(input.statusDate!==undefined&&!validStageDate(input.statusDate,{allowEmpty:false}))throw new StatusHistoryError('Enter a valid stage date.');validateMilestones(input);}catch(error){return reply(400,{error:error.message});}
   const stageDate=input.statusDate||calendarDate(new Date().toISOString());
   const quickAction=input.quickAction;
   if(quickAction!==undefined&&!['dismiss','restore','urgent','undo'].includes(quickAction))return reply(400,{error:'Invalid quick action.'});
   if(quickAction==='urgent'&&typeof input.urgent!=='boolean')return reply(400,{error:'Urgent must be true or false.'});
   if(input.applicationDate!==undefined){
    const {validApplicationDate}=await import('./export-applications.mjs');
    if(input.applicationDate!==''&&!validApplicationDate(input.applicationDate))return reply(400,{error:'Enter a valid application date.'});
   }
   if(input.applicationStatusText!==undefined&&(typeof input.applicationStatusText!=='string'||input.applicationStatusText.length>2000))return reply(400,{error:'Application status text is too long.'});
   if((quickAction===undefined&&!STATUSES.includes(input.status))||(input.notes!==undefined&&(typeof input.notes!=='string'||input.notes.length>50000)))return reply(400,{error:'Invalid status or notes.'});
   if(typeof input.revision!=='string'||!input.revision)return reply(409,{error:'Reload before saving.'});
   try {
    const edit=lastJobEdit;
    if(quickAction==='undo'&&(!edit||edit.token!==input.undoToken||edit.before.id!==input.id||edit.revision!==input.revision)){
     return reply(409,{error:'This change can no longer be undone.'});
    }
    const r=await commit(dataRoot,data=>{
     const index=data.jobs.findIndex(j=>j.id===input.id);
     if(index<0)throw new NotFound();
     if(quickAction==='undo'){
      const job={...edit.before,updatedAt:new Date().toISOString()};
      data.jobs[index]=job;
      return {job};
     }
     const job=data.jobs[index];
     const before=structuredClone(job);
     if(quickAction){
      if(quickAction==='urgent')job.urgent=input.urgent;
      if(quickAction==='dismiss'&&!['New','Shortlisted','Dismissed'].includes(job.status))throw new ConflictError('Only new or shortlisted positions can be dismissed.');
      if(quickAction==='dismiss'&&job.status!=='Dismissed'){job.dismissedFromStatus=job.status;job.status='Dismissed';}
      else if(quickAction==='restore'&&job.status==='Dismissed'){job.status=STATUSES.includes(job.dismissedFromStatus)&&job.dismissedFromStatus!=='Dismissed'?job.dismissedFromStatus:'New';delete job.dismissedFromStatus;}
     }else{
      const previousStatus=effectiveStatus(job);
      updateStage(job,input,stageDate);
      if(input.notes!==undefined)job.notes=input.notes;
      if(input.applicationDate!==undefined)job.applicationDate=input.applicationDate;
      if(input.applicationStatusText!==undefined)job.applicationStatusText=input.applicationStatusText;
      else if(previousStatus!==effectiveStatus(job)||before.applicationDate!==job.applicationDate||!isDeepStrictEqual(interviewDetails(before),interviewDetails(job)))delete job.applicationStatusText;
     }
     if(job.status==='Dismissed'&&before.status!=='Dismissed'&&job.urgent)job.urgent=false;
     if(isDeepStrictEqual(job,before))return {skipWrite:true,job};
     job.updatedAt=new Date().toISOString();
     return {job,before};
    },{expectedRevision:input.revision,tag:'jobs'});
    if(quickAction==='undo'){
     if(lastJobEdit===edit)lastJobEdit=undefined;
     return reply(200,{revision:r.revision,job:r.job});
    }
    if(!r.written)return reply(200,{revision:r.revision,job:r.job});
    const undoToken=crypto.randomUUID();
    lastJobEdit={token:undoToken,before:r.before,revision:r.revision};
    return reply(200,{revision:r.revision,job:r.job,undoToken});
   } catch(e) {
    if(e instanceof StatusHistoryError)return reply(400,{error:e.message});
    if(e instanceof NotFound)return reply(404,{error:'Position not found.'});
    if(e instanceof ConflictError)return reply(409,{error:e.message});
    if(e instanceof BusyError)return reply(409,{error:'Another save or import is running. Try again.'});
    throw e;
   }
  }
  const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/view-model.mjs':'view-model.mjs','/group-colours.mjs':'group-colours.mjs','/status-history.mjs':'status-history.mjs','/style.css':'style.css'};
  if(req.method==='GET'&&/^\/flags\/[a-z]{2}\.svg$/.test(url.pathname)){
   try{return reply(200,await readFile(path.join(root,'../node_modules/flag-icons/flags/4x3',path.basename(url.pathname))),'image/svg+xml');}catch{return reply(404,{error:'Unknown flag'});}
  }
  if(req.method!=='GET'||!files[url.pathname])return reply(404,{error:'Not found'});
  const type=/\.m?js$/.test(url.pathname)?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html';
  reply(200,await readFile(path.join(root,files[url.pathname]),'utf8'),type+'; charset=utf-8');
 }catch(e){console.error(e.message);reply(500,{error:'Could not read or save the data. See the server window.'});}
});
server.listen(port,'127.0.0.1',()=>{port=server.address().port;origin=`http://127.0.0.1:${port}`;console.log(`Application tracker: ${origin}\nData: ${dataRoot}\nKeep this window open. Ctrl+C stops the server.`);if(process.send)process.send({url:origin,installation});});
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
