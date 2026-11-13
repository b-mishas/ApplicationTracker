import {effectiveStatus,isRejectedAfterInterview} from './status-history.mjs';
// Keep filtering/sorting independent of the DOM so priority rules can be tested.
export const EMPTY='__empty__';
export const REJECTED_AFTER_INTERVIEW='Rejected after Interview';
export function choicesFor(job,key){
 if(key==='country')return job.countries?.length?job.countries:[EMPTY];
 if(key==='star'){
  const choices=[job.status==='Shortlisted'?'Shortlisted':job.status==='Dismissed'?'Dismissed':'Other'];
  if(job.urgent)choices.unshift('Urgent');
  return choices;
 }
 if(key==='status'&&isRejectedAfterInterview(job))return ['Rejected',REJECTED_AFTER_INTERVIEW];
 const v=key==='status'?effectiveStatus(job):job[key];return [v==null||v===''?EMPTY:String(v)];
}
export function filterAndSort(jobs,{filters={},search='',sort='fit',direction=-1}={}){
 const query=search.toLocaleLowerCase();
 return jobs.filter(j=>{
  if(query&&![j.company,j.title,j.group,j.reasoning,j.gaps,j.notes,j.locationRaw].join(' ').toLocaleLowerCase().includes(query))return false;
  return Object.entries(filters).every(([key,value])=>{
   if(Array.isArray(value))return !value.length||choicesFor(j,key).some(v=>value.includes(v));
   if(!value)return true;
   if(['firstSeen','applicationDate'].includes(key))return Boolean(j[key])&&j[key]>=value;
   return String(j[key]??'').toLocaleLowerCase().includes(value.toLocaleLowerCase());
  });
 }).sort((a,b)=>{
  // Dismissal has higher priority than the user's chosen column/direction.
  const group=Number(a.status==='Dismissed')-Number(b.status==='Dismissed');
  if(group)return group;
  const value=j=>sort==='star'?2*Number(Boolean(j.urgent))+Number(j.status==='Shortlisted'):sort==='country'?(j.countries||[]).join(','):sort==='status'?effectiveStatus(j):j[sort];
  const av=value(a),bv=value(b),missing=v=>v==null||v==='';
  // Highest fit breaks ties regardless of the primary sort direction.
  const fitOrder=(b.fit??0)-(a.fit??0);
  if(missing(av)||missing(bv))return missing(av)?(missing(bv)?fitOrder:1):-1;
  const primaryOrder=direction*(sort==='fit'||sort==='star'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true}));
  return primaryOrder||fitOrder;
 });
}
