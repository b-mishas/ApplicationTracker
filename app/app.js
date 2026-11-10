import {STATUS_VALUES, INTERVIEW_OUTCOMES, MILESTONE_DATES, interviewDetails, effectiveStatus, interviewHistoryText} from './status-history.mjs';
import {filterAndSort,choicesFor,EMPTY} from './view-model.mjs';
import {groupColour,ensureGroupColours} from './group-colours.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=STATUS_VALUES;
const fields=[['fit','Fit'],['company','Company'],['group','Group'],['title','Position'],['star','Actions'],['country','Country'],['city','City'],['workMode','Work mode'],['status','Status'],['seniority','Seniority'],['firstSeen','First found'],['postedDate','Posted'],['assessmentBasis','Assessment']];
let settings={exportLanguage:'en'},settingsRevision;
let supportedCountries=new Set();
let data,revision,sort='star',direction=-1,open=null,filterKey=null,pendingSave=false,lastUndo;
// Fixed class names keep application-stage styling independent of sorting.
const stageClasses=new Map([['Applied','stage-applied'],['Interview','stage-interview'],['Offer','stage-offer'],['Rejected','stage-rejected']]);
const rowStage=status=>stageClasses.get(status)||'';
const defaultStatusFilter=()=>statuses.filter(status=>!['Rejected','Dismissed','Withdrawn'].includes(status));
const filters={status:defaultStatusFilter()};
const inProgressStatuses=['Applied','Interview','Offer'];
const statusPresets={New:['New'],Shortlisted:['Shortlisted'],'In progress':inProgressStatuses,All:statuses};
const visible=new Set(fields.slice(0,9).map(x=>x[0]));
const safeUrl=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'';}catch{return '';}};
// Local SVG files also work without a flag-emoji font.
function flagGraphic(code){const iso=code==='UK'?'GB':code;return supportedCountries.has(iso)?'<img class="flag-icon" src="/flags/'+iso.toLowerCase()+'.svg" alt="'+esc(code)+'">':'';}
function cell(j,key){
 if(key==='star'){const selected=j.status==='Shortlisted',allowed=['New','Shortlisted'].includes(j.status);return `<span class="quick-actions"><button class="quick-urgent ${j.urgent?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${Boolean(j.urgent)}" aria-label="${j.urgent?'Remove urgency from':'Mark urgent'} ${esc(j.title)}" title="${j.urgent?'Remove urgent flag':'Mark as urgent'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 2Q9.1 2 9.2 3.2L10.5 14.5h3l1.3-11.3Q14.9 2 13.8 2Q12 1.6 10.2 2Z"/><circle cx="12" cy="19" r="2.2"/></svg></button><button class="shortlist-star ${selected?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${selected}" aria-label="${selected?'Remove from shortlist':'Shortlist'} ${esc(j.title)}" title="${allowed?(selected?'Remove from shortlist':'Shortlist'):'Shortlisting is available for new positions; current application stage is preserved.'}" ${allowed?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"/></svg></button><button class="quick-dismiss ${j.status==='Dismissed'?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${j.status==='Dismissed'}" aria-label="${j.status==='Dismissed'?'Restore':'Dismiss'} ${esc(j.title)}" title="${j.status==='Dismissed'?'Restore previous status':'Dismiss position'}" ${allowed||j.status==='Dismissed'?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true">${j.status==='Dismissed'?'<path d="M8 7H4v-4M4 7a8 8 0 1 1-1 9"/>':'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6m0-6-6 6"/>'}</svg></button></span>`;}
 if(key==='fit')return `<span class="badge score ${j.fit==null?'':'fit'+j.fit}">${esc(j.fit??'—')}</span>${j.assessmentBasis==='Title only'?' <span title="Provisional: posting not reviewed">◌</span>':''}`;
 if(key==='title'){const url=safeUrl(j.url);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(j.title)}</a>${j.linkType==='search'?'<span class="muted">Search link · direct posting needed</span>':''}`:esc(j.title);}
 if(key==='group'&&!j.group)return '—';
 if(key==='group'){const colour=groupColour(data.groupColours.assignments[j.group]);return `<span class="badge group" style="--group-fill:${colour.background};--group-ink:${colour.foreground}">${esc(j.group)}</span>`;}
 if(key==='status')return effectiveStatus(j)==='Offer'?'<span class="offer-status"><span class="offer-dollar" aria-hidden="true">$</span>Offer</span>':esc(effectiveStatus(j));
 if(key==='country')return (j.countries||[]).map(c=>`${flagGraphic(c)} ${esc(c)}`).join(' / ')||'—';
 return esc(j[key]||'—');
}
function filtered(){return filterAndSort(data.jobs,{filters,search:$('search').value,sort,direction});}
function stageFields(job,saved=interviewDetails(job)){
 const terminal=['Rejected','Withdrawn'].includes(job.status);
 const application=['Applied','Interview','Offer'].includes(job.status)||terminal;
 return {application,interview:job.status==='Interview'||job.status==='Offer'||terminal&&saved.hasInterview,
  offerDate:effectiveStatus(job)==='Offer'||job.status==='Withdrawn'&&Boolean(saved.offerDate),
  interviewOutcomeDate:application&&job.status!=='Applied'&&['Rejected','Withdrawn'].includes(saved.interviewOutcome)};
}
function applicationText(job){
 return [interviewHistoryText(job),job.applicationStatusText].filter(Boolean).join(' — ');
}
function customApplicationText(job,value){
 const history=interviewHistoryText(job);
 if(!history)return value;
 if(value===history)return '';
 const prefix=history+' — ';
 if(value.startsWith(prefix))return value.slice(prefix.length);
 return value.startsWith(history)?value.slice(history.length).trimStart():value;
}
const hiddenUnless=visible=>visible?'':' hidden';
function stageControls(job){
 const saved=interviewDetails(job),visible=stageFields(job,saved);
 return '<div class="stage-row">'
  +'<label>Status <select class="edit-status" title="Status saves automatically">'+statuses.map(status=>'<option'+(status===effectiveStatus(job)?' selected':'')+'>'+status+'</option>').join('')+'</select></label>'
  +'<label data-application-date'+hiddenUnless(visible.application)+'>Application date <input type="date" class="edit-application-date" value="'+esc(job.applicationDate||'')+'"></label></div>'
  +'<label data-application-status'+hiddenUnless(visible.application)+'>Application status text <input type="text" class="edit-application-status" value="'+esc(applicationText(job))+'" placeholder="Optional detail for Excel"></label>'
  +'<div class="stage-row" data-interview-row'+hiddenUnless(visible.interview)+'>'
  +milestoneInput('Interview date','interviewDate',saved.interviewDate)
  +'<label>Interview outcome <select class="edit-interview-outcome" title="Outcome saves automatically"><option value="">Pending</option>'+INTERVIEW_OUTCOMES.map(outcome=>'<option'+(outcome===saved.interviewOutcome?' selected':'')+'>'+outcome+'</option>').join('')+'</select></label></div>'
  +milestoneInput('Offer date','offerDate',saved.offerDate,visible.offerDate)
  +milestoneInput('Outcome date','interviewOutcomeDate',saved.interviewOutcomeDate,visible.interviewOutcomeDate);
}
function milestoneInput(label,key,value,visible=true){
 return '<label'+hiddenUnless(visible)+'>'+label+' <input type="date" data-milestone="'+key+'" value="'+esc(value)+'"></label>';
}
function milestoneDraft(section,job,{includeHidden=false}={}){
 const saved=interviewDetails(job);
 return Object.fromEntries([...section.querySelectorAll('[data-milestone]')]
  .filter(field=>(includeHidden||!field.closest('[hidden]'))&&field.value!==saved[field.dataset.milestone])
  .map(field=>[field.dataset.milestone,field.value]));
}
function syncStageControls(section,job,draft){
 const saved=interviewDetails(job),visible=stageFields(job,saved);
 section.querySelector('.edit-status').value=effectiveStatus(job);
 section.querySelector('.edit-interview-outcome').value=saved.interviewOutcome;
 section.querySelector('[data-interview-row]').hidden=!visible.interview;
 for(const key of MILESTONE_DATES){
  const field=section.querySelector('[data-milestone="'+key+'"]');
  field.value=draft[key]??saved[key];
  if(key!=='interviewDate')field.closest('label').hidden=!visible[key];
 }
 section.querySelector('[data-application-date]').hidden=!visible.application;
 section.querySelector('[data-application-status]').hidden=!visible.application;
}
function detail(j){return `<tr class="detail ${rowStage(effectiveStatus(j))}"><td colspan="${visible.size+1}"><div class="detail-grid"><section><h3>Why it fits</h3><p>${esc(j.reasoning||'No assessment yet.')}</p><h3>Gaps</h3><p>${esc(j.gaps||'No caveats recorded.')}</p></section><section><h3>Evidence & location</h3><p>Assessment: <b>${esc(j.assessmentBasis)}</b>\nSeniority: ${esc(j.seniority||'Unknown')}\nLocation as recorded: ${esc(j.locationRaw)}\nFirst found: ${esc(j.firstSeen)}\nPosted: ${esc(j.postedDate||'Unknown')}\nAvailability: ${esc(j.availability||'Unverified')}</p><h3>Sources</h3>${j.sources.map(s=>`<p>${esc(s.label)}${safeUrl(s.url)?` · <a target="_blank" rel="noopener noreferrer" href="${safeUrl(s.url)}">${j.linkType==='search'?'Open search':'Open listing'} ↗</a>`:''}<br><span class="muted">${esc(s.file)}</span></p>`).join('')}</section><section><h3>Your next step</h3>${stageControls(j)}<label>Notes<textarea class="edit-notes" placeholder="Questions, follow-ups, application notes…">${esc(j.notes)}</textarea></label><button class="save" data-id="${esc(j.id)}" disabled>Save changes</button> <button type="button" class="cancel" disabled title="Discard unsaved edits; saved status changes are kept">Cancel</button><span class="save-state" role="status"></span></section></div></td></tr>`;}
function dirty(){
 const area=document.querySelector('.edit-notes');if(!area)return false;
 const job=data.jobs.find(item=>item.id===open),section=area.closest('section');
 if(area.value!==job.notes||section.querySelector('.edit-status').value!==effectiveStatus(job)||Object.keys(milestoneDraft(section,job)).length)return true;
 return stageFields(job).application&&(section.querySelector('.edit-application-date').value!==(job.applicationDate||'')||section.querySelector('.edit-application-status').value!==applicationText(job));
}
function refreshEditorButtons(){
 const section=document.querySelector('.detail .save')?.closest('section');if(!section)return;
 const disabled=pendingSave||!dirty();section.querySelector('.save').disabled=disabled;section.querySelector('.cancel').disabled=disabled;
}
function refreshStatusPresets(){
 const selected=filters.status?.length?filters.status:statuses;
 for(const button of $('status-presets').querySelectorAll('[data-status-preset]')){
  const preset=statusPresets[button.dataset.statusPreset];
  button.setAttribute('aria-pressed',String(selected.length===preset.length&&preset.every(status=>selected.includes(status))));
 }
}
function refreshOverview(){
 $('total').textContent=data.jobs.length;
 $('shortlist').textContent=data.jobs.filter(j=>j.status==='Shortlisted').length;
 $('new-count').textContent=data.jobs.filter(j=>j.status==='New').length;
 $('urgent').textContent=data.jobs.filter(j=>j.urgent).length;
 $('active').textContent=data.jobs.filter(j=>inProgressStatuses.includes(effectiveStatus(j))).length;
}
function refreshUndoButton(){
 const button=$('undo-edit');
 button.disabled=pendingSave||!lastUndo;
 button.hidden=!lastUndo&&!$('undo-result').textContent;
}
function setPendingSave(pending){
 pendingSave=pending;
 refreshUndoButton();
}
let undoResultTimer;
function showUndoResult(text,details=''){
 const result=$('undo-result');
 clearTimeout(undoResultTimer);
 result.textContent=text;
 result.title=details;
 undoResultTimer=setTimeout(()=>{
  result.textContent='';
  result.title='';
  refreshUndoButton();
 },1000);
}
async function saveJobEdit(payload){
 const response=await fetch('/api/jobs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,revision})});
 const result=await response.json();
 if(!response.ok)throw Error(result.error);
 revision=result.revision;
 data.jobs[data.jobs.findIndex(job=>job.id===result.job.id)]=result.job;
 if(result.undoToken)lastUndo={id:result.job.id,undoToken:result.undoToken};
 return result.job;
}
const pendingViewKey='application-tracker.pending-view';
let lastView='',viewUpdatedAt=0;
function saveViewState(){
 const view={search:$('search').value,filters};
 const serialized=JSON.stringify(view);if(serialized===lastView)return;
 lastView=serialized;viewUpdatedAt=Math.max(Date.now(),viewUpdatedAt+1);
 const body=JSON.stringify({...view,updatedAt:viewUpdatedAt});
 try{sessionStorage.setItem(pendingViewKey,body);}catch{}
 fetch('/api/view-state',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).then(response=>{
  if(response.ok&&sessionStorage.getItem(pendingViewKey)===body)sessionStorage.removeItem(pendingViewKey);
 }).catch(()=>{});
}
async function restoreViewState(){
 let saved,pending;
 try{const response=await fetch('/api/view-state');if(response.ok)saved=await response.json();}catch{}
 try{pending=JSON.parse(sessionStorage.getItem(pendingViewKey));}catch{}
 const retry=pending&&(!saved||pending.updatedAt>saved.updatedAt);
 const view=retry?pending:saved;
 if(view){
  for(const key of Object.keys(filters))delete filters[key];
  Object.assign(filters,view.filters);$('search').value=view.search;
  viewUpdatedAt=view.updatedAt;
 }
 if(!retry)lastView=JSON.stringify({search:$('search').value,filters});
}
function render(){
 saveViewState();
 ensureGroupColours(data);
 $('search-clear').hidden=!$('search').value;
 refreshStatusPresets();
 $('since').value=filters.firstSeen||'';
 const dateActive=Boolean(filters.firstSeen);
 $('since-today').textContent=dateActive?'Clear':'Today';
 $('since-today').title=dateActive?'Clear the found-since date filter':'Found since today ('+Intl.DateTimeFormat().resolvedOptions().timeZone+')';
 const cols=fields.filter(([key])=>visible.has(key));
 // Allocate widths from the selected columns, independent of expanded content.
 const widths={fit:77,company:130.5,title:365,star:109,group:110,country:116,city:105,workMode:97.25,status:107,seniority:170,firstSeen:110,postedDate:110,assessmentBasis:137};
 const totalWidth=40+cols.reduce((sum,[key])=>sum+widths[key],0);
 $('colgroup').innerHTML=`<col style="width:${40/totalWidth*100}%">`+cols.map(([key])=>`<col style="width:${widths[key]/totalWidth*100}%">`).join('');
 $('colgroup').closest('table').style.minWidth=totalWidth+'px';
 $('head').innerHTML='<th aria-label="Details"></th>'+cols.map(([key,label])=>{
 const value=filters[key];
 const active=Array.isArray(value)
  ?value.length>0&&(key!=='status'||!statuses.every(status=>value.includes(status)))
  :Boolean(value);
 const clearButton=active?`<button type="button" class="clear-column-filter" data-clear-column-filter="${key}" aria-label="Clear ${label} filter" title="Clear ${label} filter">×</button>`:'';
 return `<th aria-sort="${sort===key?(direction===1?'ascending':'descending'):'none'}"><div class="column-heading"><button class="column-label ${active?'filtered':''}" data-filter="${key}" aria-label="Filter ${label}" aria-haspopup="dialog" aria-controls="column-filter" aria-expanded="${filterKey===key}">${label}</button>${clearButton}<button class="sort-arrow" data-sort="${key}" aria-label="Sort by ${label}" title="Sort by ${label}">${sort===key?(direction===1?'↑':'↓'):'↕'}</button></div></th>`;
 }).join('');
 const rows=filtered();
 if(open&&!rows.some(job=>job.id===open))open=null;
 $('count').textContent=`${rows.length} of ${data.jobs.length} positions`;
 $('body').innerHTML=rows.length?rows.map((j,index)=>`<tr class="job ${index%2?'stripe':'plain'} ${open===j.id?'expanded':'collapsed'} ${rowStage(effectiveStatus(j))}" data-id="${esc(j.id)}"><td><button class="toggle" data-id="${esc(j.id)}" aria-expanded="${open===j.id}" aria-label="${open===j.id?'Collapse':'Expand'} ${esc(j.title)}">${open===j.id?'−':'+'}</button></td>${cols.map(([key])=>`<td class="${key}">${cell(j,key)}</td>`).join('')}</tr>${open===j.id?detail(j):''}`).join(''):`<tr><td colspan="${cols.length+1}" class="empty">${data.jobs.length?'No positions match these filters. Try Reset.':'No positions yet. Set up the search agent to add discoveries.'}</td></tr>`;
 if(filterKey)positionFilter();
 refreshOverview();refreshEditorButtons();
}
function mayRender(){if(dirty()&&!confirm('Discard unsaved changes to this position?'))return false;render();return true;}
$('head').onclick=e=>{
 const clear=e.target.closest('[data-clear-column-filter]');
 if(clear){
  if(!canChangeView())return;
  const key=clear.dataset.clearColumnFilter;
  closeFilter();
  clearColumnFilter(key);
  $('head').querySelector(`[data-filter="${key}"]`).focus({preventScroll:true});
  return;
 }
 const label=e.target.closest('[data-filter]');if(label){showFilter(label.dataset.filter);return;}
 const arrow=e.target.closest('[data-sort]');if(!arrow||!canChangeView())return;
 direction=sort===arrow.dataset.sort?-direction:['fit','star'].includes(arrow.dataset.sort)?-1:1;sort=arrow.dataset.sort;render();
};
$('body').onclick=async e=>{
 // Links keep their normal navigation; other clicks on a position toggle its details.
 if(e.target.closest('a'))return;
 const action=e.target.closest('.quick-urgent,.shortlist-star,.quick-dismiss');
 if(action){
  if(action.disabled||pendingSave)return;
  if(dirty()){$('message').textContent='Save your edits before using quick actions.';return;}
  const job=data.jobs.find(j=>j.id===action.dataset.id);
  const payload=action.matches('.quick-urgent')?{quickAction:'urgent',urgent:!job.urgent}:action.matches('.quick-dismiss')?{quickAction:job.status==='Dismissed'?'restore':'dismiss'}:{status:job.status==='Shortlisted'?'New':'Shortlisted'};
  setPendingSave(true);action.disabled=true;$('message').textContent='';
  try{
   await saveJobEdit({id:job.id,...payload});
   render();
  }catch(error){$('message').textContent=error.message;action.disabled=false;}finally{setPendingSave(false);refreshEditorButtons();}
  return;
 }
 // Rebuild the editor from saved data, discarding edits without writing to disk.
 if(e.target.closest('.cancel')){if(!pendingSave)render();return;}
 const row=e.target.closest('tr.job');if(row){if(!canChangeView())return;open=open===row.dataset.id?null:row.dataset.id;render();return;}
 const save=e.target.closest('.save');if(!save||save.disabled||pendingSave)return;
 const section=save.closest('section'),message=section.querySelector('.save-state'),status=section.querySelector('select').value,notes=section.querySelector('textarea').value,applicationDate=section.querySelector('.edit-application-date').value,applicationStatusText=section.querySelector('.edit-application-status').value;
 const job=data.jobs.find(item=>item.id===save.dataset.id);
 const milestones=milestoneDraft(section,job);
 const applicationFields=stageFields(job).application?{applicationDate,...(applicationStatusText!==applicationText(job)?{applicationStatusText:customApplicationText(job,applicationStatusText)}:{})}:{};
 const controls=[...section.querySelectorAll('button,input,select,textarea')];
 setPendingSave(true);controls.forEach(control=>control.disabled=true);message.textContent='Saving…';
 try{
  await saveJobEdit({id:job.id,status,notes,...applicationFields,...milestones});
  render();
  const indicator=document.querySelector('.save-state');
  if(indicator)indicator.textContent='Saved to file ✓';
 }catch(error){message.textContent=error.message;}
 finally{setPendingSave(false);controls.forEach(control=>control.disabled=false);refreshEditorButtons();}
};
$('search').addEventListener('input',()=>{
 $('search-clear').hidden=!$('search').value;
 if(data&&canChangeView())render();
});
$('search-clear').onclick=()=>{
 if(!canChangeView())return;
 $('search').value='';
 render();
 $('search').focus();
};
$('since').addEventListener('change',()=>{if(!canChangeView()){$('since').value=filters.firstSeen||'';return;}filters.firstSeen=$('since').value;render();refreshOpenFilter();});
$('reset').onclick=()=>{if(!canChangeView())return;for(const key of Object.keys(filters))delete filters[key];filters.status=defaultStatusFilter();$('search').value='';closeFilter();render();};
$('columns').onchange=e=>{if(!canChangeView()){e.target.checked=!e.target.checked;return;}e.target.checked?visible.add(e.target.value):visible.delete(e.target.value);render();};
$('export').onclick=async e=>{e.preventDefault();if(pendingSave){$('message').textContent='Wait for the current save to finish.';return;}try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Export failed');const {data:latest}=await r.json();const url=URL.createObjectURL(new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`jobs-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){$('message').textContent=err.message;}};
window.addEventListener('beforeunload',e=>{if(pendingSave||dirty()){e.preventDefault();e.returnValue='';}});
async function init(){try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Could not load positions');({data,revision}=await r.json());const config=await fetch('/api/settings');if(!config.ok)throw Error('Could not load settings');const cfg=await config.json();settings=cfg.settings;settingsRevision=cfg.revision;const flags=await fetch('/api/countries');if(!flags.ok)throw Error('Could not load country codes');supportedCountries=new Set(await flags.json());await restoreViewState();$('columns').innerHTML=fields.map(([key,label])=>`<label><input type="checkbox" value="${key}" ${visible.has(key)?'checked':''}> ${label}</label>`).join('');$('imported').textContent=`${data.jobs.length} unique positions`;render();}catch(e){$('message').textContent=e.message+' — open the Start file for your system.';}}
init();
function canChangeView(){if(pendingSave){$('message').textContent='Wait for the current save to finish.';return false;}return !dirty()||confirm('Discard unsaved changes?');}
function closeFilter(){filterKey=null;$('column-filter').hidden=true;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-expanded','false'));}
function positionFilter(){
 const anchor=document.querySelector(`[data-filter="${filterKey}"]`);if(!anchor){closeFilter();return;}
 const rect=anchor.getBoundingClientRect(),menu=$('column-filter');
 menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-menu.offsetWidth-8))+'px';
 menu.style.top=Math.max(8,Math.min(rect.bottom+5,innerHeight-menu.offsetHeight-8))+'px';
}
const checkboxFields=new Set(['group','country','fit','status','workMode','assessmentBasis','star']);
function refreshOpenFilter(){if(filterKey)populateFilter();}
function clearColumnFilter(key){delete filters[key];render();refreshOpenFilter();}
function populateFilter(){
 const key=filterKey,label=fields.find(f=>f[0]===key)[1];
 $('column-filter').setAttribute('aria-label',label+' filter');
 let controls;
 if(checkboxFields.has(key)){
  let values=[...new Set(data.jobs.flatMap(j=>choicesFor(j,key)))].sort((a,b)=>{
   // Missing values belong after the named options.
   if(a===EMPTY||b===EMPTY)return Number(a===EMPTY)-Number(b===EMPTY);
   return a.localeCompare(b,undefined,{numeric:true});
  });
  if(key==='status')values=statuses;
  if(key==='fit')values=['5','4','3','2','1',EMPTY];
  if(key==='star')values=['Urgent','Shortlisted','Dismissed','Other'];
  controls=values.map(value=>`<label class="filter-choice"><input type="checkbox" data-value="${esc(value)}" ${(filters[key]||[]).includes(value)?'checked':''}>${key==='country'&&value!==EMPTY?flagGraphic(value):''}<span>${value===EMPTY?(key==='fit'?'Not assessed':'Not specified'):esc(value)}</span></label>`).join('');
 }else controls=`<label class="filter-text">${key==='firstSeen'?'Found on or after':'Contains'}<input id="column-filter-input" type="${key==='firstSeen'?'date':'search'}" value="${esc(filters[key]||'')}" aria-label="${esc(label)} filter"></label>`;
 $('column-filter').innerHTML=`<div class="filter-heading"><strong>${esc(label)}</strong><span class="filter-buttons">${checkboxFields.has(key)?'<button type="button" data-all-filter>All</button>':''}<button type="button" data-clear-filter>Clear</button></span></div><div class="filter-options">${controls}</div>`;
 positionFilter();
}
function showFilter(key){if(filterKey===key){closeFilter();return;}filterKey=key;$('column-filter').hidden=false;populateFilter();document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-expanded',b.dataset.filter===key?'true':'false'));$('column-filter').querySelector('input')?.focus();}
$('column-filter').addEventListener('change',event=>{
 if(!event.target.matches('input[type=checkbox]'))return;
 if(!canChangeView()){event.target.checked=!event.target.checked;return;}
 filters[filterKey]=[...$('column-filter').querySelectorAll('input:checked')].map(input=>input.dataset.value);render();
});
$('column-filter').addEventListener('input',event=>{
 if(event.target.id!=='column-filter-input')return;
 if(!canChangeView()){event.target.value=filters[filterKey]||'';return;}
 filters[filterKey]=event.target.value;render();
});
$('column-filter').onclick=event=>{
 const button=event.target.closest('[data-all-filter],[data-clear-filter]');
 if(!button||!canChangeView())return;
 if(button.hasAttribute('data-clear-filter')){clearColumnFilter(filterKey);return;}
 filters[filterKey]=[...$('column-filter').querySelectorAll('input[data-value]')].map(input=>input.dataset.value);
 render();
 populateFilter();
};
document.addEventListener('click',event=>{if(!event.target.closest('#column-filter,[data-filter]'))closeFilter();const menu=document.querySelector('.columns');if(!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const key=filterKey;closeFilter();document.querySelector('.columns').open=false;document.querySelector(`[data-filter="${key}"]`)?.focus();}});
window.addEventListener('resize',closeFilter);
document.querySelector('.table-wrap').addEventListener('scroll',closeFilter);
// Save only the stage (and an automatic first application date). Keep the
// editor in place so unsaved notes/date/text and edits made while saving survive.
async function saveStatus(select){
 const job=data.jobs.find(job=>job.id===open);if(!job)return;
 const outcomeControl=select.matches('.edit-interview-outcome');
 const previous=outcomeControl?interviewDetails(job).interviewOutcome:effectiveStatus(job);
 if(pendingSave){select.value=previous;return;}
 if(select.value===previous)return;
 const status=outcomeControl?job.status:select.value;
 const section=select.closest('section'),date=section.querySelector('.edit-application-date'),text=section.querySelector('.edit-application-status'),indicator=section.querySelector('.save-state');
 const dateBefore=date.value,oldText=applicationText(job);
 const autoDate=status==='Applied'&&!job.applicationDate&&!dateBefore&&!date.validity.badInput?localToday():undefined;
 const payload={id:job.id,status,statusDate:localToday(),...(outcomeControl?{interviewOutcome:select.value}:{}),...(autoDate?{applicationDate:autoDate}:{})};
 // Keep the native calendar visible. The date filter's change handler guards pending saves.
 const controls=[...section.querySelectorAll('button,select'),...document.querySelectorAll('.toolbar input:not([type=date]),.toolbar button,.toolbar select,#head button,#settings-open')];
 const focused=document.activeElement;
 const disabled=controls.map(control=>({control,wasDisabled:control.disabled}));
 setPendingSave(true);disabled.forEach(({control})=>control.disabled=true);indicator.textContent='Saving status…';$('message').textContent='';
 try{
  const saved=await saveJobEdit(payload);
  syncStageControls(section,saved,milestoneDraft(section,job,{includeHidden:true}));
  text.value=text.value===oldText?applicationText(saved):applicationText({...saved,applicationStatusText:customApplicationText(job,text.value)});
  if(autoDate&&date.value===dateBefore)date.value=saved.applicationDate||autoDate;
  const row=section.closest('tr').previousElementSibling,detailRow=section.closest('tr');
  for(const element of [row,detailRow]){element.classList.remove(...stageClasses.values());const stage=rowStage(effectiveStatus(saved));if(stage)element.classList.add(stage);}
  for(const key of ['status','star']){const cellElement=row.querySelector('td.'+key);if(cellElement)cellElement.innerHTML=cell(saved,key);}
  refreshOverview();
  // Keep the open editor visible even if its new stage is outside the current
  // filter. Filters apply again on collapse/navigation, after drafts are handled.
  indicator.textContent=dirty()?'Status saved ✓; other edits are unsaved.':'Status saved ✓';
  $('message').textContent='';
 }catch(error){select.value=previous;indicator.textContent='Status not saved: '+error.message;}
 finally{setPendingSave(false);disabled.forEach(({control,wasDisabled})=>control.disabled=wasDisabled);refreshEditorButtons();if(focused===select&&document.activeElement===document.body)select.focus();}
}
$('body').addEventListener('change',event=>{if(event.target.matches('.edit-status,.edit-interview-outcome'))saveStatus(event.target);else if(event.target.closest('.detail'))refreshEditorButtons();});
$('body').addEventListener('input',event=>{if(event.target.closest('.detail'))refreshEditorButtons();});
$('undo-edit').onclick=async()=>{
 if(!lastUndo||pendingSave)return;
 if(dirty()){showUndoResult('Save or cancel','Save or cancel your unsaved edits before undoing the last save.');return;}
 setPendingSave(true);
 $('body').inert=true;
 try{
  await saveJobEdit({...lastUndo,quickAction:'undo'});
  lastUndo=undefined;
  render();
  showUndoResult('Undone');
 }catch(error){showUndoResult('Undo failed',error.message);}
 finally{$('body').inert=false;setPendingSave(false);refreshEditorButtons();}
};
function canExportApplications(){
 if(pendingSave){$('message').textContent='Wait for the current save to finish.';return false;}
 if(dirty()){$('message').textContent='Save your changes before exporting applications.';return false;}
 $('message').textContent='';return true;
}
$('export-applications-pdf').onclick=event=>{if(!canExportApplications())event.preventDefault();};
$('export-applications').onclick=async event=>{
 event.preventDefault();const button=event.currentTarget;
 if(button.dataset.busy||!canExportApplications())return;
 button.dataset.busy='1';button.textContent='Exporting…';
 try{const response=await fetch('/api/export/applications.xlsx');if(!response.ok){const error=await response.json();throw Error(error.error);}
 const href=URL.createObjectURL(await response.blob()),a=document.createElement('a');a.href=href;a.download=`applications_${localToday()}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 }catch(error){$('message').textContent=error.message;}finally{delete button.dataset.busy;button.textContent='Excel';}
};

// Both date controls use the computer's local calendar day, including around midnight.
function localToday(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
// Quick filters share the column-filter state and remain independent.
$('since-today').onclick=()=>{
 if(!canChangeView())return;
 if(filters.firstSeen)delete filters.firstSeen;
 else filters.firstSeen=localToday();
 render();refreshOpenFilter();
};
$('status-presets').onclick=event=>{const button=event.target.closest('[data-status-preset]');if(!button||!canChangeView())return;filters.status=[...statusPresets[button.dataset.statusPreset]];render();refreshOpenFilter();};

$('settings-open').onclick=()=>{
 if(!canChangeView())return;
 $('settings-name').value=settings.exportName??'';
 $('settings-language').value=settings.exportLanguage;
 $('settings-result').textContent='';$('settings-dialog').showModal();
};
$('settings-cancel').onclick=()=>$('settings-dialog').close();
$('settings-form').onsubmit=async event=>{
 event.preventDefault();const button=$('settings-save');button.disabled=true;
 try{
  const next={schemaVersion:1,exportLanguage:$('settings-language').value,exportName:$('settings-name').value};
  const response=await fetch('/api/settings',{method:'PATCH',headers:{Origin:location.origin,'Content-Type':'application/json'},body:JSON.stringify({settings:next,revision:settingsRevision})});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  settings=result.settings;settingsRevision=result.revision;$('settings-dialog').close();$('message').textContent='Settings saved.';render();
 }catch(error){$('settings-result').textContent=error.message;}finally{button.disabled=false;}
};
