// Browser presentation and DOM extraction; data rules stay in the shared module.
import {entryFields, readOnlyFields, fieldLabel, fieldsFor, formValue, parseEntryValue} from './entry-editor.mjs';
import {validStageDate} from './status-history.mjs';

const known=new Map(entryFields.map(field=>[field[0],field]));
const hiddenFields=new Set(['otherIds','postingUrls','country','applicationCity','lastObservedAt','assessedAt','workModeAt','applicationDeadlineAt','availabilityAt','availability','statusHistory']);
export const esc = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function fieldControl(job,[key,label,type,,limit]){
 const value=formValue(job,key,type),attrs=`data-entry-field="${esc(key)}" data-field-type="${Array.isArray(type)?'select':esc(type)}"`;
 let control;
 if(Array.isArray(type)||type==='fit'){
  const options=type==='fit'?['',1,2,3,4,5]:type;
  // Retain a legacy value until the user deliberately corrects it.
  const values=options.some(option=>String(option)===String(value))?options:[value,...options];
  control=`<select ${attrs}>${values.map(option=>`<option value="${esc(option)}"${String(option)===String(value)?' selected':''}>${esc(option===''?(key==='group'?'No group':'Unknown'):option)}</option>`).join('')}</select>`;
 }else if(type==='boolean')control=`<span class="entry-checkbox-value"><input ${attrs} type="checkbox"${value?' checked':''}></span>`;
 else if(type==='textarea'||type==='json')control=`<textarea ${attrs}${limit?` maxlength="${limit}"`:''} spellcheck="${type!=='json'}">${esc(value)}</textarea>`;
 else control=`<input ${attrs} type="${type==='countries'||type==='date'&&value&&!validStageDate(value)?'text':type}" value="${esc(value)}"${limit?` maxlength="${limit}"`:''}>`;
 const help={locationRaw:'Original location wording from the listing. Country and City are separate fields.',workModeRaw:'Original listing wording, including work-arrangement restrictions. The row uses a standardized category.'}[key];
 return `<label class="entry-field"><span class="entry-label"${help?` title="${esc(help)}"`:''}>${esc(label)}</span>${control}</label>`;
}
// Table columns are presentation names; map them to the same saved fields
// used by the detail editor, rather than creating a second location value.
export function renderRowControl(job,column){
 const key=({country:'countries',lastInterview:'interviewDate'})[column]??column;
 if(!['fit','company','group','title','countries','city','workMode','status','applicationDate','interviewDate','seniority','firstSeen','postedDate','assessmentBasis'].includes(key))return null;
 const definition=known.get(key),label=definition[1];
 return fieldControl(job,definition)
  .replace('class="entry-field"','class="entry-row-field"')
  .replace('class="entry-label"','class="entry-label visually-hidden"')
  .replace('data-entry-field=','data-entry-row-field=');
}
let sourceRadioId=0;
export function sourceRow(source={},index=-1,primary=false,primaryType=''){
 const type=source.linkType??(primary?primaryType:''),name='source-type-'+(++sourceRadioId);
 const radios=`<span class="source-type" role="group" aria-label="Link type">${['search','posting'].map(value=>`<label><input type="radio" name="${name}" data-source-type value="${value}"${type===value?' checked':''}${primary?'':' disabled'}>${value==='posting'?'Posting':'Search'}</label>`).join('')}</span>`;
 return `<div class="entry-source" data-source-index="${index}" data-type-url="${esc(source.url??'')}"><label>Label<input data-source-field="label" type="text" value="${esc(source.label)}"></label><label>Listing URL<input data-source-field="url" type="url" value="${esc(source.url)}"></label><div class="entry-source-actions">${radios}<label class="source-primary" title="Use this URL when clicking the position title"><input type="checkbox" data-source-primary aria-label="Use as primary listing"${primary?' checked':''}>Primary</label><button type="button" data-remove-source aria-label="Remove listing URL" title="Remove source"><span aria-hidden="true">×</span></button></div></div>`;
}
export function sourcesForEditor(job){
 const rows=(job.sources||[]).map((source,index)=>({source,index}));
 // Some older records have a title link absent from their evidence sources.
 // Represent it without changing storage unless the user edits its links.
 if(job.url&&!rows.some(({source})=>source.url===job.url))rows.push({source:{label:'Primary listing',url:job.url,file:''},index:-2});
 const primary=Math.max(0,rows.findIndex(({source})=>source.url===job.url));
 return rows.map((row,index)=>({...row,primary:index===primary}));
}
// Fit both assessment textareas into the visible panel budget. Short content
// keeps its natural height; only overflowing content receives a scrollbar.
export function fitTextHeights(desired,minimum,budget){
 const base=minimum.reduce((sum,value)=>sum+value,0);
 const heights=[...minimum];
 let remaining=Math.max(0,budget-base);
 const order=desired.map((_,index)=>index).sort((a,b)=>(desired[a]-minimum[a])-(desired[b]-minimum[b]));
 // Satisfy shorter text first, then share the remaining space fairly. A short
 // caveat should not acquire a scrollbar just because the assessment is long.
 order.forEach((index,position)=>{
  const growth=Math.min(Math.max(0,desired[index]-minimum[index]),remaining/(order.length-position));
  heights[index]+=growth;remaining-=growth;
 });
 return heights;
}
export function renderEntryForm(job,applicationMarkup,notesMarkup){
 const fields=fieldsFor(job),byKey=new Map(fields.map(field=>[field[0],field]));
 const control=key=>fieldControl(job,byKey.get(key));
 const applicationKeys=['status','applicationDate','interviewDate','offerDate','interviewOutcomeDate','applicationStatusText','notes'];
 const shown=new Set(['url','linkType','reasoning','gaps','assessmentBasis','seniority','firstSeen','postedDate','applicationDeadline',...applicationKeys]);
 // Preserve the existing three columns. Fields not normally displayed stay
 // under a disclosure instead of expanding the normal panel into a new layout.
 const assessment=key=>control(key).replace('class="entry-label"','class="entry-label visually-hidden"');
 return `<form class="entry-form" novalidate><input type="hidden" data-entry-field="url" value="${esc(job.url)}"><input type="hidden" data-entry-field="linkType" value="${esc(job.linkType)}"><div class="detail-grid"><section><h3>Why it fits</h3>${assessment('reasoning')}<h3>Gaps</h3>${assessment('gaps')}</section><section class="entry-evidence"><h3>Evidence & location</h3>${['assessmentBasis','seniority'].map(control).join('')}${['firstSeen','postedDate','applicationDeadline'].map(control).join('')}<h3 class="entry-sources-heading">Sources</h3><div data-entry-sources>${sourcesForEditor(job).map(({source,index,primary})=>sourceRow(source,index,primary,source.url===job.url?job.linkType:'')).join('')}</div><button type="button" data-add-source>+ Add URL</button></section><section class="application-steps"><h3>Application steps</h3>${applicationMarkup??applicationKeys.filter(key=>key!=='notes').map(control).join('')}${notesMarkup??control('notes')}</section></div><details class="entry-advanced"><summary>Additional fields</summary><div class="entry-additional">${fields.filter(field=>!shown.has(field[0])&&field[0]!=='urgent').map(field=>fieldControl(job,field)).join('')}</div><div class="entry-urgent-line">${control('urgent')}</div><h3>Record metadata (read-only)</h3><dl>${Object.keys(job).filter(key=>readOnlyFields.has(key)&&!hiddenFields.has(key)).map(key=>`<dt>${esc(fieldLabel(key))}</dt><dd>${esc(typeof job[key]==='object'?JSON.stringify(job[key]):job[key])}</dd>`).join('')}</dl></details></form>`;
}
// Snapshot raw input, rather than parsed JSON: invalid drafts still count as unsaved.
export function formSnapshot(form){
 return JSON.stringify([...form.querySelectorAll('input,select,textarea,[data-source-index]')].map(control=>control.hasAttribute('data-source-index')?control.dataset.sourceIndex:['checkbox','radio'].includes(control.type)?control.checked:control.value));
}
export function readEntryChanges(form,job){
 const changes={};
 const controls=new Map([...form.querySelectorAll('[data-entry-field]')].map(control=>[control.dataset.entryField,control]));
 for(const [key,,type] of fieldsFor(job)){
  const control=controls.get(key);
  const raw=type==='boolean'?control.checked:control.value;
  if(type==='boolean'?raw===Boolean(job[key]):raw===String(formValue(job,key,type)))continue;
  changes[key]=parseEntryValue(key,type,raw);
 }
 const sources=[...form.querySelectorAll('[data-source-index]')].map(row=>{
  const index=Number(row.dataset.sourceIndex),fallback={label:'Primary listing',url:job.url,file:''};
  const original=index===-2?fallback:job.sources?.[index]||{file:''};
  const source={...original};
  for(const control of row.querySelectorAll('[data-source-field]'))source[control.dataset.sourceField]=control.value;
  const type=[...row.querySelectorAll('[data-source-type]')].find(control=>control.checked)?.value;
  const previousType=original.linkType??(original.url===job.url?job.linkType:'');
  if(source.url!==original.url){
   delete source.linkType;if(type)source.linkType=type;
  }else if(type&&(type!==previousType||Object.hasOwn(changes,'url')&&original.url===job.url))source.linkType=type;
  if(index===-2&&!Object.hasOwn(changes,'url')&&JSON.stringify(source)===JSON.stringify(fallback))return null;
  return source;
 }).filter(Boolean);
 if(JSON.stringify(sources)!==JSON.stringify(job.sources||[]))changes.sources=sources;
 return changes;
}
