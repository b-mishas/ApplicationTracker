// A dependency-free local server. Only listens on this computer.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {commit, revision, STATUSES, ConflictError, BusyError} from './store.mjs';
import {dataRoot} from './config.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||8765), origin=`http://127.0.0.1:${port}`;
class NotFound extends Error{}
const server=http.createServer(async(req,res)=>{
 const reply=(code,value,type='application/json')=>{res.writeHead(code,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(type==='application/json'?JSON.stringify(value):value);};
 try {
  if(req.headers.host!==`127.0.0.1:${port}`) return reply(403,{error:'Use the local address printed by the launcher.'});
  const url=new URL(req.url,origin);
  if(url.pathname==='/api/export/applications.xlsx' && req.method==='GET'){
   const {exportApplications}=await import('./export-applications.mjs');
   try{
    const result=await exportApplications({root:dataRoot});
    res.writeHead(200,{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="Bewerbungsuebersicht.xlsx"','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
    res.end(result.buffer);return;
   }catch(error){return reply(error.code==='EXPORT_INPUT'?422:503,{error:error.message});}
  }
  if(url.pathname==='/api/jobs' && req.method==='GET') {const raw=await readFile(path.join(dataRoot,'jobs.json'),'utf8');return reply(200,{data:JSON.parse(raw),revision:revision(raw)});}
  if(url.pathname==='/api/jobs' && req.method==='PATCH') {
   if(req.headers.origin!==origin || !req.headers['content-type']?.startsWith('application/json')) return reply(403,{error:'Save from the tracker page.'});
   let body='';for await(const chunk of req){body+=chunk;if(body.length>100000)return reply(413,{error:'Notes too large.'});}
   const input=JSON.parse(body);
   const quickAction=input.quickAction;
   if(quickAction!==undefined&&!['dismiss','restore','urgent'].includes(quickAction))return reply(400,{error:'Invalid quick action.'});
   if(quickAction==='urgent'&&typeof input.urgent!=='boolean')return reply(400,{error:'Urgent must be true or false.'});
   if(input.applicationDate!==undefined){
    const {validApplicationDate}=await import('./export-applications.mjs');
    if(input.applicationDate!==''&&!validApplicationDate(input.applicationDate))return reply(400,{error:'Enter a valid application date.'});
   }
   if(input.applicationStatusText!==undefined&&(typeof input.applicationStatusText!=='string'||input.applicationStatusText.length>2000))return reply(400,{error:'Application status text is too long.'});
   if((quickAction===undefined&&!STATUSES.includes(input.status))||(input.notes!==undefined&&(typeof input.notes!=='string'||input.notes.length>50000)))return reply(400,{error:'Invalid status or notes.'});
   if(typeof input.revision!=='string'||!input.revision)return reply(409,{error:'Reload before saving.'});
   try {
    const r=await commit(dataRoot,data=>{
     const job=data.jobs.find(j=>j.id===input.id);
     if(!job)throw new NotFound();
     if(quickAction){
      if(quickAction==='urgent')job.urgent=input.urgent;
      if(quickAction==='dismiss'&&!['New','Shortlisted','Dismissed'].includes(job.status))throw new ConflictError('Only new or shortlisted positions can be dismissed.');
      if(quickAction==='dismiss'&&job.status!=='Dismissed'){job.dismissedFromStatus=job.status;job.status='Dismissed';}
      else if(quickAction==='restore'&&job.status==='Dismissed'){job.status=STATUSES.includes(job.dismissedFromStatus)&&job.dismissedFromStatus!=='Dismissed'?job.dismissedFromStatus:'New';delete job.dismissedFromStatus;}
      job.updatedAt=new Date().toISOString();
      return {job:structuredClone(job)};
     }
     const previousStatus=job.status;
     job.status=input.status;if(input.notes!==undefined)job.notes=input.notes;
     if(input.applicationDate!==undefined)job.applicationDate=input.applicationDate;
     if(input.applicationStatusText!==undefined)job.applicationStatusText=input.applicationStatusText;
     else if(previousStatus!==job.status)delete job.applicationStatusText;
     job.updatedAt=new Date().toISOString();
     return {job:structuredClone(job)};
    },{expectedRevision:input.revision,tag:'jobs'});
    return reply(200,{revision:r.revision,job:r.job});
   } catch(e) {
    if(e instanceof NotFound)return reply(404,{error:'Position not found.'});
    if(e instanceof ConflictError)return reply(409,{error:e.message});
    if(e instanceof BusyError)return reply(409,{error:'Another save or import is running. Try again.'});
    throw e;
   }
  }
  const files={'/':'index.html','/index.html':'index.html','/app.js':'app.js','/view-model.mjs':'view-model.mjs','/style.css':'style.css'};
  if(req.method!=='GET'||!files[url.pathname])return reply(404,{error:'Not found'});
  const type=/\.m?js$/.test(url.pathname)?'text/javascript':url.pathname.endsWith('.css')?'text/css':'text/html';
  reply(200,await readFile(path.join(root,files[url.pathname]),'utf8'),type+'; charset=utf-8');
 }catch(e){console.error(e.message);reply(500,{error:'Could not read or save the data. See the server window.'});}
});
server.listen(port,'127.0.0.1',()=>console.log(`Job tracker: ${origin}\nData: ${dataRoot}\nKeep this window open. Ctrl+C stops the server.`));
server.on('error',e=>{console.error(e.message);process.exitCode=1;});
