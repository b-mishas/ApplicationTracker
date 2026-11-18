import {STATUS_VALUES, INTERVIEW_OUTCOMES, MILESTONE_DATES, interviewDetails, effectiveStatus, interviewHistoryText, validStageDate, isRejectedAfterInterview, hasSentApplication, hasReceivedOffer} from './status-history.mjs';
import {filterAndSort,choicesFor,EMPTY,REJECTED_AFTER_INTERVIEW,APPLIED_TOTAL,INTERVIEW_TOTAL,OFFER_TOTAL} from './view-model.mjs';
import {groupColour,ensureGroupColours} from './group-colours.mjs';
import {COLUMN_WIDTHS,minimumColumnWidth,MAX_COLUMN_WIDTH,clampColumnWidth} from './column-layout.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=STATUS_VALUES;
const statusFilters=statuses.flatMap(status=>status==='Rejected'?[status,REJECTED_AFTER_INTERVIEW]:[status]);
const fields=[['fit','Fit'],['company','Company'],['group','Group'],['title','Position'],['star','Actions'],['country','Country'],['city','City'],['workMode','Work mode'],['status','Status'],['applicationDate','Applied on'],['seniority','Seniority'],['firstSeen','First found'],['postedDate','Posted'],['assessmentBasis','Assessment']];
let settings={exportLanguage:'en'},settingsRevision,startupState,portState;
let supportedCountries=new Set();
let data,revision,sort='star',direction=-1,open=null,filterKey=null,pendingSave=false,lastUndo;
// Fixed class names keep application-stage styling independent of sorting.
const stageClasses=new Map([['Applied','stage-applied'],['Interview','stage-interview'],['Offer','stage-offer'],['Rejected','stage-rejected']]);
const rowStage=status=>stageClasses.get(status)||'';
const defaultStatusFilter=()=>statuses.filter(status=>!['Rejected','Dismissed','Withdrawn'].includes(status));
const filters={status:defaultStatusFilter()};
const inProgressStatuses=['Applied','Interview','Offer'];
const statusPresets={New:['New'],Shortlisted:['Shortlisted'],Urgent:statuses,'In progress':inProgressStatuses,[APPLIED_TOTAL]:[APPLIED_TOTAL],[INTERVIEW_TOTAL]:[INTERVIEW_TOTAL],[OFFER_TOTAL]:[OFFER_TOTAL],All:statuses};
const visible=new Set(fields.slice(0,9).map(x=>x[0]));
let standardLayout;
let columnOrder=fields.map(([key])=>key),columnWidths={};
const dateMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function layoutState(){return {columns:[...visible],order:[...columnOrder],widths:{...columnWidths},sort,direction};}
function applyLayout(layout){
 visible.clear();layout.columns.forEach(key=>visible.add(key));sort=layout.sort;direction=layout.direction;
 columnOrder=layout.order?[...layout.order]:fields.map(([key])=>key);
 columnWidths={...layout.widths};
}
function isInProgressView(){
 return filters.status?.length===inProgressStatuses.length&&inProgressStatuses.every(status=>filters.status.includes(status));
}
function syncViewLayout(){
 if(isInProgressView()){
  if(!standardLayout){
   // Keep the normal layout so changes in this view stay local to it.
   standardLayout=layoutState();
   visible.delete('star');visible.add('applicationDate');sort='applicationDate';direction=-1;
  }
 }else if(standardLayout){
  applyLayout(standardLayout);standardLayout=undefined;
 }
 for(const key of columnOrder){const input=$('columns').querySelector('input[value="'+key+'"]');if(input){input.checked=visible.has(key);$('columns').append(input.closest('label'));}}
}
const safeUrl=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'';}catch{return '';}};
// Local SVG files also work without a flag-emoji font.
function flagGraphic(code){const iso=code==='UK'?'GB':code;return supportedCountries.has(iso)?'<img class="flag-icon" src="/flags/'+iso.toLowerCase()+'.svg" alt="'+esc(code)+'">':'';}
function cell(j,key){
 if(key==='star'){const selected=j.status==='Shortlisted',allowed=['New','Shortlisted'].includes(j.status);return `<span class="quick-actions"><button class="quick-urgent ${j.urgent?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${Boolean(j.urgent)}" aria-label="${j.urgent?'Remove urgency from':'Mark urgent'} ${esc(j.title)}" title="${j.urgent?'Remove urgent flag':'Mark as urgent'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 2Q9.1 2 9.2 3.2L10.5 14.5h3l1.3-11.3Q14.9 2 13.8 2Q12 1.6 10.2 2Z"/><circle cx="12" cy="19" r="2.2"/></svg></button><button class="shortlist-star ${selected?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${selected}" aria-label="${selected?'Remove from shortlist':'Shortlist'} ${esc(j.title)}" title="${allowed?(selected?'Remove from shortlist':'Shortlist'):'Shortlisting is available for new positions; current application stage is preserved.'}" ${allowed?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"/></svg></button><button class="quick-dismiss ${j.status==='Dismissed'?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${j.status==='Dismissed'}" aria-label="${j.status==='Dismissed'?'Restore':'Dismiss'} ${esc(j.title)}" title="${j.status==='Dismissed'?'Restore previous status':'Dismiss position'}" ${allowed||j.status==='Dismissed'?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true">${j.status==='Dismissed'?'<path d="M8 7H4v-4M4 7a8 8 0 1 1-1 9"/>':'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6m0-6-6 6"/>'}</svg></button></span>`;}
 if(key==='fit')return `<span class="badge score ${j.fit==null?'':'fit'+j.fit}">${esc(j.fit??'—')}</span>${j.assessmentBasis==='Title only'?' <span title="Provisional: posting not reviewed">◌</span>':''}`;
 if(key==='title'){const url=safeUrl(j.url);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer" draggable="false">${esc(j.title)}</a>${j.linkType==='search'?'<span class="muted">Search link · direct posting needed</span>':''}`:esc(j.title);}
 if(key==='group'&&!j.group)return '—';
 if(key==='group'){const colour=groupColour(data.groupColours.assignments[j.group]);return `<span class="badge group" style="--group-fill:${colour.background};--group-ink:${colour.foreground}">${esc(j.group)}</span>`;}
 if(key==='status'&&isRejectedAfterInterview(j))return esc('Interview -> Rejected');
 if(key==='status')return effectiveStatus(j)==='Offer'?'<span class="offer-status"><span class="offer-dollar" aria-hidden="true">$</span>Offer</span>':esc(effectiveStatus(j));
 if(['firstSeen','postedDate','applicationDate'].includes(key)){
  const value=j[key];
  if(!validStageDate(value,{allowEmpty:false}))return key==='postedDate'?esc(value||'—'):'—';
  // ISO components keep calendar dates independent of browser timezone.
  const [year,month,day]=value.split('-');
  return `<time datetime="${esc(value)}">${Number(day)} ${dateMonths[Number(month)-1]} ${year}</time>`;
 }
 if(key==='country')return (j.countries||[]).map(c=>`<span class="country-code">${flagGraphic(c)} ${esc(c)}</span>`).join(' / ')||'—';
 return esc(j[key]||'—');
}
function filtered(){return filterAndSort(data.jobs,{filters,search:$('search').value,sort,direction});}
function stageFields(job,saved=interviewDetails(job)){
 const terminal=['Rejected','Withdrawn'].includes(job.status);
 const application=['Applied','Interview','Offer'].includes(job.status)||terminal;
 return {application,interview:job.status==='Interview'||job.status==='Offer'||terminal&&saved.hasInterview,
  offerDate:effectiveStatus(job)==='Offer'||Boolean(saved.offerDate),
  interviewOutcomeDate:terminal};
}
function applicationText(job){
 // A saved manual value, including an empty string, replaces generated history.
 return job.applicationStatusText??interviewHistoryText(job);
}
const hiddenUnless=visible=>visible?'':' hidden';
const canApply=job=>['New','Shortlisted'].includes(effectiveStatus(job));
function stageControls(job){
 const saved=interviewDetails(job),visible=stageFields(job,saved);
 return '<div class="stage-row">'
  +'<label>Status <select class="edit-status" title="Status saves automatically">'+statuses.map(status=>'<option'+(status===effectiveStatus(job)?' selected':'')+'>'+status+'</option>').join('')+'</select></label>'
  +'<button type="button" class="apply-status" title="Mark this position as Applied"'+hiddenUnless(canApply(job))+'>Applied</button>'
  +dateInput('Application date','applicationDate',job.applicationDate||'',visible.application)+'</div>'
  +'<label data-application-status'+hiddenUnless(visible.application)+'>Application status text <input type="text" class="edit-application-status" value="'+esc(applicationText(job))+'" placeholder="Optional status text for export"></label>'
  +'<div class="applied-shortcuts"'+hiddenUnless(effectiveStatus(job)==='Applied')+'><button type="button" data-next-status="Rejected">Rejected</button><button type="button" data-next-status="Interview">Interview</button></div>'
  +'<div class="stage-row" data-interview-row'+hiddenUnless(visible.interview)+'>'
  +milestoneInput('Interview date','interviewDate',saved.interviewDate)
  +'<div class="interview-outcomes" role="group" aria-label="Interview outcome"><span>Interview outcome</span><div>'+INTERVIEW_OUTCOMES.map(outcome=>'<button type="button" data-next-status="'+outcome+'" aria-pressed="'+(effectiveStatus(job)===outcome)+'">'+(outcome==='Offer'?'<span class="offer-dollar" aria-hidden="true">$</span>':'')+outcome+'</button>').join('')+'</div></div></div>'
  +milestoneInput('Offer date','offerDate',saved.offerDate,visible.offerDate)
  +milestoneInput(effectiveStatus(job)==='Withdrawn'?'Withdrawal date':'Rejection date','interviewOutcomeDate',saved.interviewOutcomeDate,visible.interviewOutcomeDate);
}
function dateInput(label,key,value,visible=true){
 const application=key==='applicationDate',id='step-'+key;
 return '<div class="date-field'+(key==='offerDate'?' date-field-half':'')+'"'+(application?' data-application-date':'')+hiddenUnless(visible)+'><label for="'+id+'">'+label+'</label><span class="date-control"><input id="'+id+'" type="date" '+(application?'class="edit-application-date"':'data-milestone="'+key+'"')+' value="'+esc(value)+'"><button type="button" class="clear-date" aria-label="Clear '+label.toLowerCase()+'" title="Clear '+label.toLowerCase()+'"'+(value?'':' disabled')+'><span aria-hidden="true">×</span></button></span></div>';
}
function milestoneInput(label,key,value,visible=true){return dateInput(label,key,value,visible);}
function milestoneDraft(section,job,{includeHidden=false}={}){
 const saved=interviewDetails(job);
 return Object.fromEntries([...section.querySelectorAll('[data-milestone]')]
  .filter(field=>(includeHidden||!field.closest('[hidden]'))&&field.value!==saved[field.dataset.milestone])
  .map(field=>[field.dataset.milestone,field.value]));
}
function syncStageControls(section,job,draft){
 const saved=interviewDetails(job),visible=stageFields(job,saved);
 section.querySelector('.edit-status').value=effectiveStatus(job);
 section.querySelector('.apply-status').hidden=!canApply(job);
 section.querySelector('.applied-shortcuts').hidden=effectiveStatus(job)!=='Applied';
 for(const button of section.querySelectorAll('.interview-outcomes button'))button.setAttribute('aria-pressed',String(button.dataset.nextStatus===effectiveStatus(job)));
 section.querySelector('[data-interview-row]').hidden=!visible.interview;
 for(const key of MILESTONE_DATES){
  const field=section.querySelector('[data-milestone="'+key+'"]');
  field.value=draft[key]??saved[key];
  if(key==='interviewOutcomeDate'){
   const label=effectiveStatus(job)==='Withdrawn'?'Withdrawal date':'Rejection date',container=field.closest('.date-field');
   container.querySelector('label').textContent=label;
   container.querySelector('.clear-date').setAttribute('aria-label','Clear '+label.toLowerCase());
   container.querySelector('.clear-date').title='Clear '+label.toLowerCase();
  }
  if(key!=='interviewDate')field.closest('.date-field').hidden=!visible[key];
 }
 section.querySelector('[data-application-date]').hidden=!visible.application;
 section.querySelector('[data-application-status]').hidden=!visible.application;
}
// Reuse the menu control markup, dropping IDs so the expanded copy stays unique.
function detailUndoControls(){
 return '<div class="undo-control">'+$('undo-result').outerHTML.replace(' id="undo-result"','')+$('undo-edit').outerHTML.replace(' id="undo-edit"','')+'</div>';
}
function detail(j){return `<tr class="detail ${rowStage(effectiveStatus(j))} ${isRejectedAfterInterview(j)?'rejected-after-interview':''} ${j.urgent?'urgent':''}"><td colspan="${visible.size+1}"><div class="detail-toolbar">${detailUndoControls()}</div><div class="detail-grid"><section><h3>Why it fits</h3><p>${esc(j.reasoning||'No assessment yet.')}</p><h3>Gaps</h3><p>${esc(j.gaps||'No caveats recorded.')}</p></section><section><h3>Evidence & location</h3><p>Assessment: <b>${esc(j.assessmentBasis)}</b>\nSeniority: ${esc(j.seniority||'Unknown')}\nLocation as recorded: ${esc(j.locationRaw)}\nFirst found: ${esc(j.firstSeen)}\nPosted: ${esc(j.postedDate||'Unknown')}\nAvailability: ${esc(j.availability||'Unverified')}</p><h3>Sources</h3>${j.sources.map(s=>`<p>${esc(s.label)}${safeUrl(s.url)?` · <a target="_blank" rel="noopener noreferrer" href="${safeUrl(s.url)}">${j.linkType==='search'?'Open search':'Open listing'} ↗</a>`:''}<br><span class="muted">${esc(s.file)}</span></p>`).join('')}</section><section class="application-steps"><h3>Application steps</h3>${stageControls(j)}<label>Notes<textarea class="edit-notes" placeholder="Questions, follow-ups, application notes…">${esc(j.notes)}</textarea></label><button class="save" data-id="${esc(j.id)}" disabled>Save changes</button> <button type="button" class="cancel" disabled title="Discard unsaved edits; saved status changes are kept">Cancel</button><span class="save-state" role="status"></span></section></div></td></tr>`;}
function dirty(){
 const area=document.querySelector('.edit-notes');if(!area)return false;
 const job=data.jobs.find(item=>item.id===open),section=area.closest('section');
 if(area.value!==job.notes||section.querySelector('.edit-status').value!==effectiveStatus(job)||Object.keys(milestoneDraft(section,job)).length)return true;
 return stageFields(job).application&&(section.querySelector('.edit-application-date').value!==(job.applicationDate||'')||section.querySelector('.edit-application-status').value!==applicationText(job));
}
function refreshEditorButtons(){
 const section=document.querySelector('.detail .save')?.closest('section');if(!section)return;
 const disabled=pendingSave||!dirty();section.querySelector('.save').disabled=disabled;section.querySelector('.cancel').disabled=disabled;
 for(const button of section.querySelectorAll('.clear-date')){const input=button.previousElementSibling;button.disabled=pendingSave||(!input.value&&!input.validity.badInput);}
}
function hasUrgentFilter(){return filters.star?.length===1&&filters.star[0]==='Urgent';}
function refreshStatusPresets(){
 const selectedFilters=filters.status?.length?filters.status:statuses;
 // The interview subgroup is redundant when all rejections are selected.
 const withoutSubgroup=selectedFilters.includes('Rejected')?selectedFilters.filter(status=>status!==REJECTED_AFTER_INTERVIEW):selectedFilters;
 const selected=statuses.every(status=>withoutSubgroup.includes(status))?withoutSubgroup.filter(status=>![APPLIED_TOTAL,INTERVIEW_TOTAL,OFFER_TOTAL].includes(status)):withoutSubgroup;
 const urgentView=hasUrgentFilter()&&selected.length===statuses.length&&statuses.every(status=>selected.includes(status));
 for(const button of document.querySelectorAll('[data-status-preset]')){
  const name=button.dataset.statusPreset,preset=statusPresets[name];
  const active=name==='Urgent'?urgentView:!urgentView&&selected.length===preset.length&&preset.every(status=>selected.includes(status));
  button.setAttribute('aria-pressed',String(active));
 }
}
function refreshOverview(){
 $('total').textContent=data.jobs.length;
 $('applied-total').textContent=data.jobs.filter(hasSentApplication).length;
 $('interview-total').textContent=data.jobs.filter(job=>interviewDetails(job).hasInterview).length;
 $('shortlist').textContent=data.jobs.filter(j=>j.status==='Shortlisted').length;
 $('new-count').textContent=data.jobs.filter(j=>j.status==='New').length;
 $('urgent').textContent=data.jobs.filter(j=>j.urgent).length;
 $('active').textContent=data.jobs.filter(j=>inProgressStatuses.includes(effectiveStatus(j))).length;
 $('new-count').classList.toggle('has-new',Number($('new-count').textContent)>0);
 const offers=data.jobs.filter(hasReceivedOffer).length;
 $('offer-total').textContent=offers;
 $('offers-preset').hidden=offers===0;
}
function refreshUndoButton(){
 // The menu Undo is global; the expanded copy belongs only to its edited row.
 const toolbar=document.querySelector('.detail-toolbar');
 if(toolbar)toolbar.hidden=lastUndo?.id!==open&&(!$('undo-result').textContent||undoResultJobId!==open);
 for(const button of document.querySelectorAll('[data-undo-edit]')){
  button.disabled=pendingSave||!lastUndo;
  button.hidden=!lastUndo&&!$('undo-result').textContent;
  button.onclick=undoEdit;
 }
}
function setPendingSave(pending){
 pendingSave=pending;
 refreshUndoButton();
}
let undoResultTimer,undoResultJobId;
function showUndoResult(text,details='',jobId=lastUndo?.id){
 undoResultJobId=jobId;
 clearTimeout(undoResultTimer);
 for(const result of document.querySelectorAll('[data-undo-result]')){result.textContent=text;result.title=details;}
 refreshUndoButton();
 undoResultTimer=setTimeout(()=>{
  for(const result of document.querySelectorAll('[data-undo-result]')){result.textContent='';result.title='';}
  undoResultJobId=undefined;
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
function viewState(){return {search:$('search').value,filters,layout:layoutState(),...(standardLayout?{standardLayout}:{})};}
function saveViewState(){
 const view=viewState();
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
  if(view.layout)applyLayout(view.layout);
  standardLayout=view.standardLayout;
  viewUpdatedAt=view.updatedAt;
 }
 if(!retry)lastView=JSON.stringify(viewState());
}
// Resize columns without rendering again, so an open editor keeps its draft.
function resizeColumns(){
 const columns=[...$('colgroup').children];
 if(!columns.length)return;
 const table=$('colgroup').closest('table');
 const totalWidth=columns.reduce((sum,column)=>sum+Number(column.dataset.width),0);
 const flexibleWidth=columns.reduce((sum,column)=>sum+(column.hasAttribute('data-fixed')?0:Number(column.dataset.width)),0);
 const extraWidth=Math.max(0,table.parentElement.clientWidth-totalWidth);
 for(const column of columns){
  const baseWidth=Number(column.dataset.width);
  column.style.width=(baseWidth+(column.hasAttribute('data-fixed')?0:extraWidth*baseWidth/flexibleWidth))+'px';
 }
 table.style.minWidth=totalWidth+'px';
 table.style.width=(totalWidth+(flexibleWidth?extraWidth:0))+'px';
 for(const handle of $('head').querySelectorAll('[data-resize-column]')){
  const width=Math.round(handle.closest('th').getBoundingClientRect().width);
  handle.setAttribute('aria-valuenow',width);handle.setAttribute('aria-valuetext',width+' pixels');
 }
}
new ResizeObserver(resizeColumns).observe(document.querySelector('.table-wrap'));
function render(){
 syncViewLayout();
 saveViewState();
 ensureGroupColours(data);
 $('search-clear').hidden=!$('search').value;
 refreshStatusPresets();
 const cols=columnOrder.filter(key=>visible.has(key)).map(key=>fields.find(field=>field[0]===key));
 // Keep controls compact. Extra table width goes to the flexible columns.
 const widths={...COLUMN_WIDTHS,...columnWidths};
 const totalWidth=44+cols.reduce((sum,[key])=>sum+widths[key],0);
 $('colgroup').innerHTML='<col data-width="44" data-fixed style="width:44px">'+cols.map(([key])=>`<col data-column="${key}" data-width="${widths[key]}" ${Object.hasOwn(columnWidths,key)||['fit','star','country'].includes(key)?'data-fixed':''} style="width:${widths[key]}px">`).join('');
 $('colgroup').closest('table').style.minWidth=totalWidth+'px';
 $('head').innerHTML='<th aria-label="Details"></th>'+cols.map(([key,label])=>{
 const value=filters[key];
 const active=Array.isArray(value)
  ?value.length>0&&!allCheckboxValuesSelected(key,value)
  :Boolean(value);
 const clearButton=active?`<button type="button" class="clear-column-filter" data-clear-column-filter="${key}" aria-label="Clear ${label} filter" title="Clear ${label} filter">×</button>`:'';
 return `<th data-column="${key}" aria-sort="${sort===key?(direction===1?'ascending':'descending'):'none'}"><div class="column-heading"><button class="column-label ${active?'filtered':''}" data-filter="${key}" title="Drag to move; Alt+Left/Right moves with the keyboard" aria-label="Filter ${label}" aria-haspopup="dialog" aria-controls="column-filter" aria-expanded="${filterKey===key}">${label}</button>${clearButton}<button class="sort-arrow" data-sort="${key}" aria-label="Sort by ${label}" title="Sort by ${label}">${sort===key?(direction===1?'↑':'↓'):'↕'}</button></div><button type="button" class="column-resize-handle" data-resize-column="${key}" role="separator" aria-orientation="vertical" aria-label="Resize ${label} column" aria-valuemin="${minimumColumnWidth(key)}" aria-valuemax="${MAX_COLUMN_WIDTH}" title="Drag to resize; double-click or Home restores automatic width. Left/Right adjusts width."></button></th>`;
 }).join('');
 const rows=filtered();
 if(open&&!rows.some(job=>job.id===open))open=null;
 $('count').textContent=`${rows.length} of ${data.jobs.length} positions`;
 $('body').innerHTML=rows.length?rows.map((j,index)=>`<tr class="job ${index%2?'stripe':'plain'} ${open===j.id?'expanded':'collapsed'} ${rowStage(effectiveStatus(j))} ${isRejectedAfterInterview(j)?'rejected-after-interview':''} ${j.urgent?'urgent':''}" data-id="${esc(j.id)}"><td><button class="toggle" data-id="${esc(j.id)}" aria-expanded="${open===j.id}" aria-label="${open===j.id?'Collapse':'Expand'} ${esc(j.title)}">${open===j.id?'−':'+'}</button></td>${cols.map(([key])=>`<td data-column="${key}" class="${key}">${cell(j,key)}</td>`).join('')}</tr>${open===j.id?detail(j):''}`).join(''):`<tr><td colspan="${cols.length+1}" class="empty">${data.jobs.length?'No positions match these filters. Try Reset.':'No positions yet. Set up the search agent to add discoveries.'}</td></tr>`;
 resizeColumns();
 if(filterKey)positionFilter();
 refreshOverview();refreshEditorButtons();refreshUndoButton();
}
function mayRender(){if(dirty()&&!confirm('Discard unsaved changes to this position?'))return false;render();return true;}
// Move existing cells rather than rendering: an expanded editor keeps its draft and focus.
function moveColumn(key,target,after=false){
 if(key===target)return;
 const order=columnOrder.filter(value=>value!==key);
 order.splice(order.indexOf(target)+(after?1:0),0,key);
 if(order.every((value,index)=>value===columnOrder[index]))return;
 columnOrder=order;
 const focused=document.activeElement;
 for(const row of [$('colgroup'),$('head'),...$('body').querySelectorAll('tr.job')]){
  for(const column of columnOrder){const cell=[...row.children].find(child=>child.dataset.column===column);if(cell)row.append(cell);}
 }
 for(const column of columnOrder){const input=$('columns').querySelector('input[value="'+column+'"]');if(input)$('columns').append(input.closest('label'));}
 if(focused?.isConnected&&document.activeElement!==focused)focused.focus({preventScroll:true});
 saveViewState();
 $('column-layout-result').textContent=fields.find(field=>field[0]===key)[1]+' column moved';
}
let columnDrag,suppressHeaderClickUntil=0;
function clearColumnDrag(){
 if(columnDrag?.active)suppressHeaderClickUntil=performance.now()+250;
 document.body.classList.remove('column-dragging');
 $('head').querySelectorAll('.drag-source,.drop-before,.drop-after').forEach(header=>header.classList.remove('drag-source','drop-before','drop-after'));
 columnDrag=null;
}
$('head').addEventListener('pointerdown',event=>{
 const label=event.target.closest('.column-label');
 if(!label||event.button!==0||!event.isPrimary)return;
 columnDrag={key:label.dataset.filter,label,pointerId:event.pointerId,x:event.clientX,y:event.clientY,active:false};
});
document.addEventListener('pointermove',event=>{
 const drag=columnDrag;if(!drag||event.pointerId!==drag.pointerId)return;
 if(!drag.label.isConnected){clearColumnDrag();return;}
 if(!drag.active){
  if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<6)return;
  drag.active=true;closeFilter();drag.label.setPointerCapture(event.pointerId);
  document.body.classList.add('column-dragging');drag.label.closest('th').classList.add('drag-source');
 }
 event.preventDefault();
 $('head').querySelectorAll('.drop-before,.drop-after').forEach(header=>header.classList.remove('drop-before','drop-after'));
 const target=document.elementFromPoint(event.clientX,event.clientY)?.closest('#head th[data-column]');
 drag.target=target?.dataset.column;
 if(!target||drag.target===drag.key)return;
 const rect=target.getBoundingClientRect();drag.after=event.clientX>rect.left+rect.width/2;
 target.classList.add(drag.after?'drop-after':'drop-before');
});
document.addEventListener('pointerup',event=>{
 const drag=columnDrag;if(!drag||event.pointerId!==drag.pointerId)return;
 if(drag.active&&drag.target)moveColumn(drag.key,drag.target,drag.after);
 clearColumnDrag();
});
document.addEventListener('pointercancel',clearColumnDrag);
$('head').addEventListener('lostpointercapture',clearColumnDrag);
$('head').addEventListener('keydown',event=>{
 const label=event.target.closest('.column-label');
 if(event.key==='Escape'&&columnDrag?.active){event.preventDefault();clearColumnDrag();return;}
 if(!label||!event.altKey||!['ArrowLeft','ArrowRight'].includes(event.key))return;
 event.preventDefault();closeFilter();
 const shown=columnOrder.filter(key=>visible.has(key)),index=shown.indexOf(label.dataset.filter),step=event.key==='ArrowLeft'?-1:1;
 if(shown[index+step])moveColumn(label.dataset.filter,shown[index+step],step===1);
});
// Only the column sizing changes during a drag; the expanded editor is never rebuilt.
function applyColumnWidth(key,width){
 if(width===undefined)delete columnWidths[key];else columnWidths[key]=clampColumnWidth(key,width);
 const column=$('colgroup').querySelector('[data-column="'+key+'"]');if(!column)return;
 column.dataset.width=columnWidths[key]??COLUMN_WIDTHS[key];
 column.toggleAttribute('data-fixed',Object.hasOwn(columnWidths,key)||['fit','star','country'].includes(key));
 resizeColumns();
}
function announceColumnWidth(key){
 const handle=$('head').querySelector('[data-resize-column="'+key+'"]');
 $('column-layout-result').textContent=fields.find(field=>field[0]===key)[1]+' width '+handle.getAttribute('aria-valuetext');
}
let columnResize;
function finishColumnResize(cancel=false){
 const resize=columnResize;if(!resize)return;
 columnResize=null;
 if(cancel)applyColumnWidth(resize.key,resize.previous);
 else if(resize.changed){saveViewState();announceColumnWidth(resize.key);}
 document.body.classList.remove('column-resizing');
 if(resize.handle.hasPointerCapture(resize.pointerId))resize.handle.releasePointerCapture(resize.pointerId);
 // A completed pointer gesture must not leave a keyboard-style focus mark.
 // Keyboard resizing never enters this path; Escape cancellation keeps focus.
 if(!cancel&&document.activeElement===resize.handle)resize.handle.blur();
}
$('head').addEventListener('pointerdown',event=>{
 const handle=event.target.closest('[data-resize-column]');
 if(!handle||event.button!==0||!event.isPrimary)return;
 event.preventDefault();closeFilter();handle.focus({preventScroll:true});
 const key=handle.dataset.resizeColumn;
 columnResize={key,handle,pointerId:event.pointerId,x:event.clientX,width:handle.closest('th').getBoundingClientRect().width,previous:columnWidths[key],changed:false};
 handle.setPointerCapture(event.pointerId);document.body.classList.add('column-resizing');
});
document.addEventListener('pointermove',event=>{
 const resize=columnResize;if(!resize||event.pointerId!==resize.pointerId)return;
 if(!resize.handle.isConnected){finishColumnResize(true);return;}
 const delta=event.clientX-resize.x;if(!resize.changed&&delta===0)return;
 event.preventDefault();resize.changed=true;applyColumnWidth(resize.key,resize.width+delta);
});
document.addEventListener('pointerup',event=>{if(columnResize?.pointerId===event.pointerId)finishColumnResize();});
document.addEventListener('pointercancel',()=>finishColumnResize(true));
$('head').addEventListener('lostpointercapture',()=>finishColumnResize(true));
$('head').addEventListener('dblclick',event=>{
 const handle=event.target.closest('[data-resize-column]');if(!handle)return;
 event.preventDefault();applyColumnWidth(handle.dataset.resizeColumn);saveViewState();announceColumnWidth(handle.dataset.resizeColumn);
});
$('head').addEventListener('keydown',event=>{
 if(event.key==='Escape'&&columnResize){event.preventDefault();finishColumnResize(true);return;}
 const handle=event.target.closest('[data-resize-column]');
 if(!handle||!['ArrowLeft','ArrowRight','Home'].includes(event.key))return;
 event.preventDefault();closeFilter();const key=handle.dataset.resizeColumn;
 const delta=(event.key==='ArrowLeft'?-1:1)*(event.shiftKey?50:10);
 applyColumnWidth(key,event.key==='Home'?undefined:handle.closest('th').getBoundingClientRect().width+delta);
 saveViewState();announceColumnWidth(key);
});
$('head').onclick=e=>{
 if(performance.now()<suppressHeaderClickUntil)return;
 const clear=e.target.closest('[data-clear-column-filter]');
 if(clear){
  if(!canChangeView())return;
  const key=clear.dataset.clearColumnFilter;
  closeFilter();
  clearColumnFilter(key);
  $('head').querySelector(`[data-filter="${key}"]`)?.focus({preventScroll:true});
  return;
 }
 const label=e.target.closest('[data-filter]');if(label){showFilter(label.dataset.filter);return;}
 const arrow=e.target.closest('[data-sort]');if(!arrow||!canChangeView())return;
 direction=sort===arrow.dataset.sort?-direction:['fit','star','applicationDate'].includes(arrow.dataset.sort)?-1:1;sort=arrow.dataset.sort;render();
};
$('body').onclick=async e=>{
 const row=e.target.closest('tr.job');
 // A text-selection gesture must keep its range and avoid link navigation.
 if(row&&!e.target.closest('button')){
  const selection=window.getSelection();
  if(selection&&!selection.isCollapsed&&selection.containsNode(row,true)){e.preventDefault();return;}
 }
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
 const clearDate=e.target.closest('.clear-date');
 if(clearDate){
  if(clearDate.disabled||pendingSave)return;
  const input=clearDate.previousElementSibling;input.value='';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  input.focus({preventScroll:true});
  return;
 }
 const apply=e.target.closest('.apply-status,[data-next-status]');
 if(apply){
  if(apply.disabled||pendingSave)return;
  const select=apply.closest('section').querySelector('.edit-status');
  select.value=apply.dataset.nextStatus||'Applied';
  await saveStatus(select);
  return;
 }
 // Rebuild the editor from saved data, discarding edits without writing to disk.
 if(e.target.closest('.cancel')){if(!pendingSave)render();return;}
 if(row){if(!canChangeView())return;open=open===row.dataset.id?null:row.dataset.id;render();return;}
 const save=e.target.closest('.save');if(!save||save.disabled||pendingSave)return;
 const section=save.closest('section'),message=section.querySelector('.save-state'),status=section.querySelector('select').value,notes=section.querySelector('textarea').value,applicationDate=section.querySelector('.edit-application-date').value,applicationStatusText=section.querySelector('.edit-application-status').value;
 const job=data.jobs.find(item=>item.id===save.dataset.id);
 const milestones=milestoneDraft(section,job);
 const datesChanged=applicationDate!==(job.applicationDate||'')||Object.keys(milestones).length>0;
 const generatedText=interviewHistoryText({...job,applicationDate,...milestones});
 const manualText=(applicationStatusText!==applicationText(job)||datesChanged)&&(!datesChanged||applicationStatusText!==generatedText);
 const applicationFields=stageFields(job).application?{applicationDate,...(manualText?{applicationStatusText}:{})}:{};
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
$('reset').onclick=()=>{
 if(!canChangeView())return;
 for(const key of Object.keys(filters))delete filters[key];
 filters.status=defaultStatusFilter();$('search').value='';closeFilter();
 // Restore the normal columns first, then override its remembered sort.
 syncViewLayout();sort='star';direction=-1;render();
};
$('columns').onchange=e=>{if(!canChangeView()){e.target.checked=!e.target.checked;return;}e.target.checked?visible.add(e.target.value):visible.delete(e.target.value);render();};
$('export').onclick=async e=>{e.preventDefault();if(pendingSave){$('message').textContent='Wait for the current save to finish.';return;}try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Export failed');const {data:latest}=await r.json();const url=URL.createObjectURL(new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`jobs-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){$('message').textContent=err.message;}};
window.addEventListener('beforeunload',e=>{if(pendingSave||dirty()){e.preventDefault();e.returnValue='';}});
async function init(){try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Could not load positions');({data,revision}=await r.json());const config=await fetch('/api/settings');if(!config.ok)throw Error('Could not load settings');const cfg=await config.json();settings=cfg.settings;settingsRevision=cfg.revision;const flags=await fetch('/api/countries');if(!flags.ok)throw Error('Could not load country codes');supportedCountries=new Set(await flags.json());await restoreViewState();$('columns').innerHTML=columnOrder.map(key=>fields.find(field=>field[0]===key)).map(([key,label])=>`<label><input type="checkbox" value="${key}" ${visible.has(key)?'checked':''}> ${label}</label>`).join('');$('imported').textContent=`${data.jobs.length} unique positions`;render();}catch(e){$('message').textContent=e.message+' — open the Start file for your system.';}}
async function loadBuildVersion(){
 try{
  const response=await fetch('/api/version');if(!response.ok)return;
  const build=await response.json();
  $('build-version').textContent='Version '+build.version;
  $('build-version').title=build.builtAt?'Built '+new Date(build.builtAt).toLocaleString():'Source checkout';
 }catch{} // Version availability must not prevent using the tracker.
}
loadBuildVersion();
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
function checkboxValues(key){
 let values=[...new Set(data.jobs.flatMap(j=>choicesFor(j,key)))].sort((a,b)=>{
  // Missing values belong after the named options.
  if(a===EMPTY||b===EMPTY)return Number(a===EMPTY)-Number(b===EMPTY);
  return a.localeCompare(b,undefined,{numeric:true});
 });
 if(key==='status')values=statusFilters;
 if(key==='fit')values=['5','4','3','2','1',EMPTY];
 if(key==='star')values=['Urgent','Shortlisted','Dismissed','Other'];
 return values;
}
function allCheckboxValuesSelected(key,selected){
 const values=key==='status'?statuses:checkboxValues(key);
 return selected.length>0&&values.every(value=>selected.includes(value));
}
function setCheckboxFilter(key,selected){
 if(selected.length)filters[key]=selected;
 else delete filters[key];
}
function populateFilter(){
 const key=filterKey,label=fields.find(f=>f[0]===key)[1];
 $('column-filter').setAttribute('aria-label',label+' filter');
 let controls;
 if(checkboxFields.has(key)){
  const values=checkboxValues(key);
  const selected=filters[key]||[];
  controls=values.map(value=>`<label class="filter-choice"><input type="checkbox" data-value="${esc(value)}" ${selected.includes(value)?'checked':''}>${key==='country'&&value!==EMPTY?flagGraphic(value):''}<span>${value===EMPTY?(key==='fit'?'Not assessed':'Not specified'):esc(value)}</span></label>`).join('');
 }else{
  const dateFilter=['firstSeen','applicationDate'].includes(key);
  const prompt=key==='firstSeen'?'Found since':key==='applicationDate'?'Applied on or after':'Contains';
  controls=`<label class="filter-text">${prompt}<input id="column-filter-input" type="${dateFilter?'date':'search'}" value="${esc(filters[key]||'')}" aria-label="${esc(label)} filter"></label>`;
 }
 $('column-filter').innerHTML=`<div class="filter-heading"><strong>${esc(label)}</strong><span class="filter-buttons">${checkboxFields.has(key)?'<button type="button" data-all-filter>All</button>':''}<button type="button" data-clear-filter>Clear</button></span></div><div class="filter-options">${controls}</div>`;
 positionFilter();
}
function showFilter(key){if(filterKey===key){closeFilter();return;}filterKey=key;$('column-filter').hidden=false;populateFilter();document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-expanded',b.dataset.filter===key?'true':'false'));$('column-filter').querySelector('input')?.focus();}
$('column-filter').addEventListener('change',event=>{
 if(!event.target.matches('input[type=checkbox]'))return;
 if(!canChangeView()){event.target.checked=!event.target.checked;return;}
 setCheckboxFilter(filterKey,[...$('column-filter').querySelectorAll('input:checked')].map(input=>input.dataset.value));render();
});
$('column-filter').addEventListener('input',event=>{
 if(event.target.id!=='column-filter-input')return;
 if(!canChangeView()){event.target.value=filters[filterKey]||'';return;}
 filters[filterKey]=event.target.value;render();
});
$('column-filter').onclick=event=>{
 const button=event.target.closest('[data-all-filter],[data-clear-filter]');
 if(!button||!canChangeView())return;
 const clear=button.hasAttribute('data-clear-filter');
 if(clear)delete filters[filterKey];
 else setCheckboxFilter(filterKey,checkboxValues(filterKey));
 render();refreshOpenFilter();
 $('column-filter').querySelector(clear?'[data-clear-filter]':'[data-all-filter]')?.focus({preventScroll:true});
};
document.addEventListener('click',event=>{
 // The popup can replace its buttons during this click; the event path survives that rebuild.
 if(!event.composedPath().includes($('column-filter'))&&!event.target.closest('[data-filter]'))closeFilter();
 const menu=document.querySelector('.columns');
 if(!menu.contains(event.target))menu.open=false;
});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const key=filterKey;closeFilter();document.querySelector('.columns').open=false;document.querySelector(`[data-filter="${key}"]`)?.focus();}});
window.addEventListener('resize',closeFilter);
document.querySelector('.table-wrap').addEventListener('scroll',closeFilter);
// Save only the stage (and an automatic first application date). Keep the
// editor in place so unsaved notes/date/text and edits made while saving survive.
async function saveStatus(select){
 const job=data.jobs.find(job=>job.id===open);if(!job)return;
 const previous=effectiveStatus(job);
 if(pendingSave){select.value=previous;return;}
 if(select.value===previous)return;
 const status=select.value;
 const section=select.closest('section'),date=section.querySelector('.edit-application-date'),text=section.querySelector('.edit-application-status'),indicator=section.querySelector('.save-state');
 const dateBefore=date.value,oldText=applicationText(job);
 const autoDate=status==='Applied'?localToday():undefined;
 const payload={id:job.id,status,statusDate:localToday(),...(autoDate?{applicationDate:autoDate}:{})};
 // Keep native editor calendars stable by leaving date inputs enabled.
 const controls=[...section.querySelectorAll('button,select'),...document.querySelectorAll('.sidebar button,.toolbar input:not([type=date]),.toolbar button,.toolbar select,#head button,#settings-open')];
 const focused=document.activeElement;
 const disabled=controls.map(control=>({control,wasDisabled:control.disabled}));
 setPendingSave(true);disabled.forEach(({control})=>control.disabled=true);indicator.textContent='Saving status…';$('message').textContent='';
 try{
  const saved=await saveJobEdit(payload);
  syncStageControls(section,saved,milestoneDraft(section,job,{includeHidden:true}));
  if(text.value===oldText)text.value=applicationText(saved);
  if(autoDate&&date.value===dateBefore&&dateBefore===(job.applicationDate||''))date.value=saved.applicationDate||autoDate;
  const row=section.closest('tr').previousElementSibling,detailRow=section.closest('tr');
  for(const element of [row,detailRow]){element.classList.remove(...stageClasses.values());element.classList.toggle('urgent',Boolean(saved.urgent));element.classList.toggle('rejected-after-interview',isRejectedAfterInterview(saved));const stage=rowStage(effectiveStatus(saved));if(stage)element.classList.add(stage);}
  for(const key of ['status','star','applicationDate']){const cellElement=row.querySelector('td.'+key);if(cellElement)cellElement.innerHTML=cell(saved,key);}
  refreshOverview();
  // Keep the open editor visible even if its new stage is outside the current
  // filter. Filters apply again on collapse/navigation, after drafts are handled.
  indicator.textContent=dirty()?'Status saved ✓; other edits are unsaved.':'Status saved ✓';
  $('message').textContent='';
 }catch(error){select.value=previous;indicator.textContent='Status not saved: '+error.message;}
 finally{setPendingSave(false);disabled.forEach(({control,wasDisabled})=>control.disabled=wasDisabled);refreshEditorButtons();if(focused===select&&document.activeElement===document.body)select.focus();}
}
$('body').addEventListener('change',event=>{
 if(event.target.matches('.edit-status'))saveStatus(event.target);
 else if(event.target.closest('.detail')){
  if(event.target.matches('input[type=date]')&&!event.target.validity.badInput&&validStageDate(event.target.value)){
   const job=data.jobs.find(job=>job.id===open),section=event.target.closest('section');
   section.querySelector('.edit-application-status').value=interviewHistoryText({...job,applicationDate:section.querySelector('.edit-application-date').value,...milestoneDraft(section,job)});
  }
  refreshEditorButtons();
 }
});
$('body').addEventListener('input',event=>{if(event.target.closest('.detail'))refreshEditorButtons();});
async function undoEdit(){
 if(!lastUndo||pendingSave)return;
 if(dirty()){showUndoResult('Save or cancel','Save or cancel your unsaved edits before undoing the last save.');return;}
 const undoneId=lastUndo.id;
 setPendingSave(true);
 $('body').inert=true;
 try{
  await saveJobEdit({...lastUndo,quickAction:'undo'});
  lastUndo=undefined;
  render();
  showUndoResult('Undone','',undoneId);
 }catch(error){showUndoResult('Undo failed',error.message);}
 finally{$('body').inert=false;setPendingSave(false);refreshEditorButtons();}
}
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

// Suggested application and status dates use the computer's local calendar day.
function localToday(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
// Quick filters share the column-filter state and remain independent.
function selectStatusPreset(event){
 const button=event.target.closest('[data-status-preset]');if(!button||!canChangeView())return;
 const name=button.dataset.statusPreset;
 if(name==='Urgent')filters.star=['Urgent'];
 else if(hasUrgentFilter())delete filters.star;
 setCheckboxFilter('status',[...statusPresets[name]]);
 render();refreshOpenFilter();
}
$('status-presets').onclick=selectStatusPreset;


$('settings-open').onclick=async()=>{
 if(!canChangeView())return;
 $('settings-name').value=settings.exportName??'';
 $('settings-language').value=settings.exportLanguage;
 $('settings-result').textContent='';startupState=undefined;portState=undefined;
 $('settings-advanced').open=false;$('settings-port').disabled=true;$('settings-port').value=location.port||'8765';
 $('settings-port-help').textContent='Loading local port…';
 $('settings-address').textContent=location.origin;$('settings-address').href=location.origin;
 $('settings-startup').checked=false;$('settings-startup').disabled=true;
 $('settings-startup-help').textContent='Checking startup preference…';$('settings-dialog').showModal();
 try{
  const response=await fetch('/api/startup');if(!response.ok)throw Error('Could not read startup preference.');
  startupState=await response.json();$('settings-startup').checked=startupState.enabled;$('settings-startup').disabled=!startupState.supported;
  $('settings-startup-help').textContent=startupState.supported?'Starts in the background without opening a browser.':'Automatic startup is available on Windows only for now.';
 }catch(error){$('settings-startup-help').textContent=error.message;}
 try{
  const response=await fetch('/api/port-settings');
  if(response.status===404)throw Error('Port settings need a server update. Open the Restart file for your system, then reload this page.');
  if(!response.ok)throw Error('Could not read local port. Reopen Settings to try again.');
  portState=await response.json();$('settings-port').value=portState.port;$('settings-port').disabled=portState.controlledByEnvironment;
  $('settings-port-help').textContent=portState.controlledByEnvironment?'The port is controlled by JOBTRACKER_PORT.':portState.pending?'Port '+portState.port+' is saved for the next Restart. The current address stays active until then. Update your bookmark afterwards.':'Changes apply after Restart. Update your bookmark if you change the port.';
 }catch(error){$('settings-port-help').textContent=error.message;}
};
$('settings-cancel').onclick=()=>$('settings-dialog').close();
$('settings-port').oninvalid=()=>{$('settings-advanced').open=true;};
$('settings-form').onsubmit=async event=>{
 event.preventDefault();const button=$('settings-save');button.disabled=true;
 try{
  if(portState&&!$('settings-port').disabled&&Number($('settings-port').value)!==portState.port){
   const response=await fetch('/api/port-settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({port:Number($('settings-port').value),revision:portState.revision})});
   const result=await response.json();if(!response.ok)throw Error(result.error);portState=result;
  }
  const next={schemaVersion:1,exportLanguage:$('settings-language').value,exportName:$('settings-name').value};
  const response=await fetch('/api/settings',{method:'PATCH',headers:{Origin:location.origin,'Content-Type':'application/json'},body:JSON.stringify({settings:next,revision:settingsRevision})});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  settings=result.settings;settingsRevision=result.revision;
  if(startupState?.supported&&$('settings-startup').checked!==startupState.enabled){
   const response=await fetch('/api/startup',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:$('settings-startup').checked})});
   const result=await response.json();if(!response.ok)throw Error('Export settings saved. Startup preference could not be saved: '+result.error);
   startupState=result;
  }
  $('settings-dialog').close();$('message').textContent=portState?.pending?'Settings saved. Port '+portState.port+' will apply after Restart. Update your bookmark afterwards.':'Settings saved.';render();
 }catch(error){$('settings-result').textContent=error.message+(portState?.pending?' Port '+portState.port+' is saved for the next Restart.':'');}finally{button.disabled=false;}
};
