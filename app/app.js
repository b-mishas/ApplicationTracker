import {filterAndSort,choicesFor,EMPTY} from './view-model.mjs';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statuses=['New','Shortlisted','Applied','Interview','Offer','Rejected','Withdrawn','Dismissed'];
const fields=[['fit','Fit'],['company','Company'],['group','Group'],['title','Position'],['star','Actions'],['country','Country'],['city','City'],['workMode','Work mode'],['status','Status'],['seniority','Seniority'],['firstSeen','First found'],['postedDate','Posted'],['assessmentBasis','Assessment']];
let settings={groups:[],countries:[],timezone:'',exportLanguage:'en'},settingsRevision;
let data,revision,sort='star',direction=-1,open=null,filterKey=null,pendingSave=false;
const defaultStatusFilter=()=>statuses.filter(status=>!['Rejected','Dismissed','Withdrawn'].includes(status));
const filters={status:defaultStatusFilter()};
const visible=new Set(fields.slice(0,9).map(x=>x[0]));
const hue=g=>[...g].reduce((n,c)=>n+c.charCodeAt(0),0)%360;
const safeUrl=url=>{try{const u=new URL(url);return ['https:','http:'].includes(u.protocol)?esc(u.href):'';}catch{return '';}};
// Local SVG files also work without a flag-emoji font.
function flagGraphic(code){const iso=code==='UK'?'GB':code;return /^[A-Z]{2}$/.test(iso)?'<img class="flag-icon" src="/flags/'+iso.toLowerCase()+'.svg" alt="'+esc(code)+'">':'';}
function cell(j,key){
 if(key==='star'){const selected=j.status==='Shortlisted',allowed=['New','Shortlisted'].includes(j.status);return `<span class="quick-actions"><button class="quick-urgent ${j.urgent?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${Boolean(j.urgent)}" aria-label="${j.urgent?'Remove urgency from':'Mark urgent'} ${esc(j.title)}" title="${j.urgent?'Remove urgent flag':'Mark as urgent'}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.2 2Q9.1 2 9.2 3.2L10.5 14.5h3l1.3-11.3Q14.9 2 13.8 2Q12 1.6 10.2 2Z"/><circle cx="12" cy="19" r="2.2"/></svg></button><button class="shortlist-star ${selected?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${selected}" aria-label="${selected?'Remove from shortlist':'Shortlist'} ${esc(j.title)}" title="${allowed?(selected?'Remove from shortlist':'Shortlist'):'Shortlisting is available for new positions; current application stage is preserved.'}" ${allowed?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.3.9-4.55 4.45 1.07 6.28L12 17.36l-5.62 2.97 1.07-6.28L2.9 9.6l6.3-.9Z"/></svg></button><button class="quick-dismiss ${j.status==='Dismissed'?'selected':''}" data-id="${esc(j.id)}" aria-pressed="${j.status==='Dismissed'}" aria-label="${j.status==='Dismissed'?'Restore':'Dismiss'} ${esc(j.title)}" title="${j.status==='Dismissed'?'Restore previous status':'Dismiss position'}" ${allowed||j.status==='Dismissed'?'':'disabled'}><svg viewBox="0 0 24 24" aria-hidden="true">${j.status==='Dismissed'?'<path d="M8 7H4v-4M4 7a8 8 0 1 1-1 9"/>':'<circle cx="12" cy="12" r="8"/><path d="m9 9 6 6m0-6-6 6"/>'}</svg></button></span>`;}
 if(key==='fit')return `<span class="badge score ${['both','fit'].includes($('colour').value)?'fit'+j.fit:''}">${esc(j.fit??'—')}</span>${j.assessmentBasis==='Title only'?' <span title="Provisional: posting not reviewed">◌</span>':''}`;
 if(key==='title'){const url=safeUrl(j.url);return url?`<a href="${url}" target="_blank" rel="noopener noreferrer">${esc(j.title)}</a>${j.linkType==='search'?'<span class="muted">Search link · direct posting needed</span>':''}`:esc(j.title);}
 if(key==='group'&&!j.group)return '—';
 if(key==='group')return `<span class="badge ${['both','group'].includes($('colour').value)?'group':''}" style="--hue:${hue(j.group)}">${esc(j.group)}</span>`;
 if(key==='status')return esc(j.status);
 if(key==='country')return (j.countries||[]).map(c=>{const iso=c==='UK'?'GB':c;const flag=/^[A-Z]{2}$/.test(iso)?[...iso].map(ch=>String.fromCodePoint(127397+ch.charCodeAt(0))).join(''):'';return `${flagGraphic(c)} ${esc(c)}`;}).join(' / ')||'—';
 return esc(j[key]||'—');
}
function filtered(){return filterAndSort(data.jobs,{filters,search:$('search').value,sort,direction});}
function detail(j){return `<tr class="detail"><td colspan="${visible.size+1}"><div class="detail-grid"><section><h3>Why it fits</h3><p>${esc(j.reasoning||'No assessment yet.')}</p><h3>Gaps</h3><p>${esc(j.gaps||'No caveats recorded.')}</p></section><section><h3>Evidence & location</h3><p>Assessment: <b>${esc(j.assessmentBasis)}</b>\nSeniority: ${esc(j.seniority||'Unknown')}\nLocation as recorded: ${esc(j.locationRaw)}\nFirst found: ${esc(j.firstSeen)}\nPosted: ${esc(j.postedDate||'Unknown')}\nAvailability: ${esc(j.availability||'Unverified')}</p><h3>Sources</h3>${j.sources.map(s=>`<p>${esc(s.label)}${safeUrl(s.url)?` · <a target="_blank" rel="noopener noreferrer" href="${safeUrl(s.url)}">${j.linkType==='search'?'Open search':'Open listing'} ↗</a>`:''}<br><span class="muted">${esc(s.file)}</span></p>`).join('')}</section><section><h3>Your next step</h3><label>Status <select class="edit-status">${statuses.map(s=>`<option ${s===j.status?'selected':''}>${s}</option>`).join('')}</select></label><label>Application date <input type="date" class="edit-application-date" value="${esc(j.applicationDate||'')}"></label><label>Application status text <input type="text" class="edit-application-status" value="${esc(j.applicationStatusText||'')}" placeholder="Optional detail for Excel"></label><label>Notes<textarea class="edit-notes" placeholder="Questions, follow-ups, application notes…">${esc(j.notes)}</textarea></label><button class="save" data-id="${esc(j.id)}">Save changes</button> <button type="button" class="cancel">Cancel</button><span class="save-state" role="status"></span></section></div></td></tr>`;}
function dirty(){const area=document.querySelector('.edit-notes');if(!area)return false;const j=data.jobs.find(j=>j.id===open);return area.value!==j.notes||document.querySelector('.edit-status').value!==j.status||document.querySelector('.edit-application-date').value!==(j.applicationDate||'')||document.querySelector('.edit-application-status').value!==(j.applicationStatusText||'');}
function nextStatusShortcut(){
 if(filters.status?.length===1){
  if(filters.status[0]==='New')return 'Shortlisted';
  if(filters.status[0]==='Shortlisted')return 'Clear';
 }
 return 'New';
}
function render(){
 $('search-clear').hidden=!$('search').value;
 const nextStatus=nextStatusShortcut();
 $('shortlist-filter').textContent=nextStatus;
 $('shortlist-filter').title=nextStatus==='Clear'?'Restore the default status filter':`Show ${nextStatus.toLowerCase()} positions`;
 $('shortlist-filter').setAttribute('aria-pressed',String(nextStatus!=='New'));
 $('since').value=filters.firstSeen||'';
 const dateActive=Boolean(filters.firstSeen);
 $('since-today').textContent=dateActive?'Clear':'Today';
 $('since-today').title=dateActive?'Clear the found-since date filter':'Found since today ('+(settings.timezone||'UTC')+')';
 const cols=fields.filter(([key])=>visible.has(key));
 // Allocate widths from the selected columns, independent of expanded content.
 const widths={fit:59.5,company:130.5,title:365,star:94,group:110,country:100,city:105,workMode:90.25,status:100,seniority:170,firstSeen:110,postedDate:110,assessmentBasis:130};
 const totalWidth=40+cols.reduce((sum,[key])=>sum+widths[key],0);
 $('colgroup').innerHTML=`<col style="width:${40/totalWidth*100}%">`+cols.map(([key])=>`<col style="width:${widths[key]/totalWidth*100}%">`).join('');
 $('colgroup').closest('table').style.minWidth=totalWidth+'px';
 $('head').innerHTML='<th aria-label="Details"></th>'+cols.map(([key,label])=>{
 const active=Array.isArray(filters[key])?filters[key].length:Boolean(filters[key]);
 return `<th aria-sort="${sort===key?(direction===1?'ascending':'descending'):'none'}"><div class="column-heading"><button class="column-label ${active?'filtered':''}" data-filter="${key}" aria-label="Filter ${label}" aria-haspopup="dialog" aria-controls="column-filter" aria-expanded="${filterKey===key}">${label}${active?' •':''}</button><button class="sort-arrow" data-sort="${key}" aria-label="Sort by ${label}" title="Sort by ${label}">${sort===key?(direction===1?'↑':'↓'):'↕'}</button></div></th>`;
 }).join('');
 const rows=filtered();$('count').textContent=`${rows.length} of ${data.jobs.length} positions`;
 $('body').innerHTML=rows.length?rows.map((j,index)=>`<tr class="job ${index%2?'stripe':'plain'} ${open===j.id?'expanded':'collapsed'}" data-id="${esc(j.id)}"><td><button class="toggle" data-id="${esc(j.id)}" aria-expanded="${open===j.id}" aria-label="${open===j.id?'Collapse':'Expand'} ${esc(j.title)}">${open===j.id?'−':'+'}</button></td>${cols.map(([key])=>`<td class="${key}">${cell(j,key)}</td>`).join('')}</tr>${open===j.id?detail(j):''}`).join(''):`<tr><td colspan="${cols.length+1}" class="empty">${data.jobs.length?'No positions match these filters. Try Reset.':'No positions yet. Set up the search agent to add discoveries.'}</td></tr>`;
 if(filterKey)positionFilter();
 $('total').textContent=data.jobs.length;$('strong').textContent=data.jobs.filter(j=>j.fit>=4).length;$('shortlist').textContent=data.jobs.filter(j=>j.status==='Shortlisted').length;$('active').textContent=data.jobs.filter(j=>['Applied','Interview','Offer'].includes(j.status)).length;
}
function mayRender(){if(dirty()&&!confirm('Discard unsaved changes to this position?'))return false;render();return true;}
$('head').onclick=e=>{
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
  pendingSave=true;action.disabled=true;$('message').textContent='';
  try{
   const response=await fetch('/api/jobs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:job.id,revision,...payload})});
   const result=await response.json();if(!response.ok)throw Error(result.error);
   revision=result.revision;data.jobs[data.jobs.findIndex(j=>j.id===job.id)]=result.job;render();
  }catch(error){$('message').textContent=error.message;action.disabled=false;}finally{pendingSave=false;}
  return;
 }
 // Rebuild the editor from saved data, discarding edits without writing to disk.
 if(e.target.closest('.cancel')){if(!pendingSave)render();return;}
 const row=e.target.closest('tr.job');if(row){if(dirty()&&!confirm('Discard unsaved changes?'))return;open=open===row.dataset.id?null:row.dataset.id;render();return;}
 const save=e.target.closest('.save');if(!save||pendingSave)return;
 const section=save.closest('section'),message=section.querySelector('.save-state'),status=section.querySelector('select').value,notes=section.querySelector('textarea').value,applicationDate=section.querySelector('.edit-application-date').value,applicationStatusText=section.querySelector('.edit-application-status').value;
 pendingSave=true;save.disabled=true;message.textContent='Saving…';
 try{const response=await fetch('/api/jobs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:save.dataset.id,revision,status,notes,applicationDate,applicationStatusText})});const result=await response.json();if(!response.ok)throw Error(result.error);revision=result.revision;const j=data.jobs.find(j=>j.id===save.dataset.id);j.status=status;j.notes=notes;j.applicationDate=applicationDate;j.applicationStatusText=applicationStatusText;render();const indicator=document.querySelector('.save-state');if(indicator)indicator.textContent='Saved to file ✓';}catch(error){message.textContent=error.message;save.disabled=false;}finally{pendingSave=false;}
};
$('search').addEventListener('input',()=>{
 $('search-clear').hidden=!$('search').value;
 if(canChangeView())render();
});
$('search-clear').onclick=()=>{
 if(!canChangeView())return;
 $('search').value='';
 render();
 $('search').focus();
};
$('since').addEventListener('change',()=>{if(!canChangeView()){$('since').value=filters.firstSeen||'';return;}filters.firstSeen=$('since').value;render();refreshOpenFilter();});
$('colour').addEventListener('change',()=>mayRender());
$('reset').onclick=()=>{if(!canChangeView())return;for(const key of Object.keys(filters))delete filters[key];filters.status=defaultStatusFilter();$('search').value='';closeFilter();render();};
$('columns').onchange=e=>{if(dirty()&&!confirm('Discard unsaved changes?')){e.target.checked=!e.target.checked;return;}e.target.checked?visible.add(e.target.value):visible.delete(e.target.value);render();};
$('export').onclick=async e=>{e.preventDefault();try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Export failed');const {data:latest}=await r.json();const url=URL.createObjectURL(new Blob([JSON.stringify(latest,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`jobs-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}catch(err){$('message').textContent=err.message;}};
window.addEventListener('beforeunload',e=>{if(dirty()){e.preventDefault();e.returnValue='';}});
async function init(){try{const r=await fetch('/api/jobs');if(!r.ok)throw Error('Could not load positions');({data,revision}=await r.json());const config=await fetch('/api/settings');if(!config.ok)throw Error('Could not load settings');const cfg=await config.json();settings=cfg.settings;settingsRevision=cfg.revision;if(!cfg.ready)$('message').textContent='Complete Settings to configure your groups, countries and timezone.';$('columns').innerHTML=fields.map(([key,label])=>`<label><input type="checkbox" value="${key}" ${visible.has(key)?'checked':''}> ${label}</label>`).join('');$('imported').textContent=`${data.jobs.length} unique positions`;render();}catch(e){$('message').textContent=e.message+' — open the Start file for your system.';}}
init();
function canChangeView(){return !dirty()||confirm('Discard unsaved changes?');}
function closeFilter(){filterKey=null;$('column-filter').hidden=true;document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-expanded','false'));}
function positionFilter(){
 const anchor=document.querySelector(`[data-filter="${filterKey}"]`);if(!anchor){closeFilter();return;}
 const rect=anchor.getBoundingClientRect(),menu=$('column-filter');
 menu.style.left=Math.max(8,Math.min(rect.left,innerWidth-menu.offsetWidth-8))+'px';
 menu.style.top=Math.max(8,Math.min(rect.bottom+5,innerHeight-menu.offsetHeight-8))+'px';
}
const checkboxFields=new Set(['group','country','fit','status','workMode','assessmentBasis','star']);
function refreshOpenFilter(){if(filterKey)populateFilter();}
function populateFilter(){
 const key=filterKey,label=fields.find(f=>f[0]===key)[1];
 $('column-filter').setAttribute('aria-label',label+' filter');
 let controls;
 if(checkboxFields.has(key)){
  let values=[...new Set(data.jobs.flatMap(j=>choicesFor(j,key)))].sort((a,b)=>{
   // Missing values belong after the named options.
   if(a===EMPTY||b===EMPTY)return Number(a===EMPTY)-Number(b===EMPTY);
   if(key==='group')return (settings.groups.indexOf(a)<0?999:settings.groups.indexOf(a))-(settings.groups.indexOf(b)<0?999:settings.groups.indexOf(b))||a.localeCompare(b);
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
 if(button.hasAttribute('data-all-filter')){
  filters[filterKey]=[...$('column-filter').querySelectorAll('input[data-value]')].map(input=>input.dataset.value);
 }else{
  delete filters[filterKey];
 }
 render();
 populateFilter();
};
document.addEventListener('click',event=>{if(!event.target.closest('#column-filter,[data-filter]'))closeFilter();const menu=document.querySelector('.columns');if(!menu.contains(event.target))menu.open=false;});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){const key=filterKey;closeFilter();document.querySelector('.columns').open=false;document.querySelector(`[data-filter="${key}"]`)?.focus();}});
window.addEventListener('resize',closeFilter);
document.querySelector('.table-wrap').addEventListener('scroll',closeFilter);
// Selecting a new stage clears historical wording belonging to the old stage.
$('body').addEventListener('change',event=>{
 if(!event.target.matches('.edit-status'))return;
 const section=event.target.closest('section');
 section.querySelector('.edit-application-status').value='';
 const date=section.querySelector('.edit-application-date');
 // Suggest today's configured local date only for an undated application; save remains explicit.
 if(event.target.value==='Applied'&&!date.value)date.value=localToday();
});
$('export-applications').onclick=async event=>{
 event.preventDefault();const button=event.currentTarget;if(button.dataset.busy)return;
 if(dirty()){$('message').textContent='Save your changes before exporting applications.';return;}
 button.dataset.busy='1';button.textContent='Exporting…';$('message').textContent='';
 try{const response=await fetch('/api/export/applications.xlsx');if(!response.ok){const error=await response.json();throw Error(error.error);}
 const href=URL.createObjectURL(await response.blob()),a=document.createElement('a');a.href=href;a.download='applications.xlsx';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
 }catch(error){$('message').textContent=error.message;}finally{delete button.dataset.busy;button.textContent='Export applications';}
};

// Both date controls use the same local calendar day, including around midnight.
function localToday(){const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:settings.timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));return `${p.year}-${p.month}-${p.day}`;}
// Quick filters share the column-filter state and remain independent.
$('since-today').onclick=()=>{
 if(!canChangeView())return;
 if(filters.firstSeen)delete filters.firstSeen;
 else filters.firstSeen=localToday();
 render();refreshOpenFilter();
};
$('shortlist-filter').onclick=()=>{if(!canChangeView())return;const nextStatus=nextStatusShortcut();filters.status=nextStatus==='Clear'?defaultStatusFilter():[nextStatus];render();refreshOpenFilter();};

$('settings-open').onclick=()=>{
 if(!canChangeView())return;
 $('settings-groups').value=settings.groups.join('\n');$('settings-countries').value=settings.countries.join(', ');$('settings-timezone').value=settings.timezone;$('settings-language').value=settings.exportLanguage;
 $('settings-result').textContent='';$('settings-dialog').showModal();
};
$('settings-detect').onclick=()=>{$('settings-timezone').value=Intl.DateTimeFormat().resolvedOptions().timeZone;};
$('settings-cancel').onclick=()=>$('settings-dialog').close();
$('settings-form').onsubmit=async event=>{
 event.preventDefault();const button=$('settings-save');button.disabled=true;
 try{
  const next={schemaVersion:1,groups:$('settings-groups').value.split(/\n/).map(v=>v.trim()).filter(Boolean),countries:$('settings-countries').value.toUpperCase().split(/[\s,]+/).filter(Boolean),timezone:$('settings-timezone').value.trim(),exportLanguage:$('settings-language').value};
  const response=await fetch('/api/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({settings:next,revision:settingsRevision})});
  const result=await response.json();if(!response.ok)throw Error(result.error);
  settings=result.settings;settingsRevision=result.revision;$('settings-dialog').close();$('message').textContent='Settings saved.';render();
 }catch(error){$('settings-result').textContent=error.message;}finally{button.disabled=false;}
};
