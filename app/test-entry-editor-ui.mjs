// Run the actual UI helpers with small DOM doubles; no live inventory is used.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as editor from './entry-editor.mjs';
import * as formHelpers from './entry-form.mjs';
import * as history from './status-history.mjs';
const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const block=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const job={id:'test',status:'New',url:'',linkType:'search',sources:[]};
const url={value:''},type={value:'search',options:[],add(option){this.options.push(option);}};
let choices=[],saved,rendered=0,queued=[],resizes=0;
const message={textContent:''};
const form={querySelectorAll:()=>choices,reportValidity:()=>true,querySelector(selector){
 if(selector==='[data-entry-field="url"]')return url;
 if(selector==='[data-entry-field="linkType"]')return type;
 return null;
}};
const context=vm.createContext({...editor,...formHelpers,...history,data:{jobs:[job]},editingId:job.id,pendingSave:false,supportedCountries:new Set(),
 document:{querySelector:selector=>selector==='.entry-form'?form:selector==='.entry-save-state'?message:null,querySelectorAll:()=>[]},
 Option:function(text,value){this.text=text;this.value=value;},
 readEntryChanges:()=>({notes:'Corrected'}),saveJobEdit:async payload=>{saved=payload;},
 setPendingSave(){},refreshEditorButtons(){},render(){rendered++;},showMessage(){},
 hideRowDuplicateFields(){},syncRowFields(){},
 requestAnimationFrame:callback=>{queued.push(callback);return queued.length;},resizeAssessmentFields:()=>{resizes++;}
});
vm.runInContext(block('function updatePrimarySource(', 'function cancelEntry(')+block('async function saveEntry(', 'function hasUrgentFilter('),context);
await context.saveEntry();
assert.equal(saved.changes.notes,'Corrected');assert.equal(rendered,1);assert.equal(url.value,'');
context.editingId=job.id;
const choice=value=>({checked:false,closest:()=>({querySelector:()=>({value})})});
choices=[choice('https://www.linkedin.com/jobs/search/?keywords=protein')];
context.updatePrimarySource(choices[0]);assert.equal(type.value,'search');
choices=[choice('https://www.linkedin.com/jobs/view/123')];
context.updatePrimarySource(choices[0]);assert.equal(type.value,'posting');
choices=[choice('https://example.org/vacancy')];
context.updatePrimarySource(choices[0]);assert.equal(type.value,'');
type.value='posting';context.updatePrimarySource();assert.equal(type.value,'posting','Save preserves the explicit choice');
assert.equal(editor.inferredLinkType('https://linkedin.com.evil.test/jobs/search/'),null);
let draftJob;
context.syncStageControls=(section,record)=>{draftJob=record;};
vm.runInContext(block('function stageEntryStatus(', '// Additional fields'),context);
context.stageEntryStatus({value:'Rejected',closest:()=>({querySelector:()=>({value:'2026-11-20'}),querySelectorAll:()=>[
 {dataset:{milestone:'interviewDate'},value:'2026-11-26'},
 {dataset:{milestone:'offerDate'},value:'2026-11-27'}
]})});
vm.runInContext(block('function stageFields(', 'function applicationText('),context);
assert.equal(context.stageFields(draftJob).interview,true);
assert.equal(context.stageFields(draftJob).offerDate,true);
assert.equal(draftJob.applicationDate,'2026-11-20');
vm.runInContext(block('let assessmentResizeFrame=', 'function resizeAssessmentFields('),context);
context.scheduleAssessmentResize();context.scheduleAssessmentResize();
assert.equal(queued.length,1);queued.shift()();assert.equal(resizes,1);
context.scheduleAssessmentResize();assert.equal(queued.length,1);
// Both modes render identical controls; only full-edit mode adds field bindings.
context.statuses=history.STATUS_VALUES;
vm.runInContext(block('function applicationText(', 'function milestoneDraft('),context);
const normal=context.stageControls(job),editing=context.stageControls(job,true);
assert(!normal.includes('data-entry-field'));
for(const key of ['status','applicationDate','applicationStatusText','interviewDate','offerDate','interviewOutcomeDate']){
 assert.equal(editing.split(`data-entry-field="${key}"`).length-1,1,key);
}
console.log('PASS: linkless saves, primary link classification, draft visibility, stage markup and coalesced textarea resizing.');

// Exercise the actual sidebar scheduler/cache without a live browser or inventory.
{
 let frames=[],measurements=0,writes=0;
 const properties=new Map(),classes=new Set();
 const shell={dataset:{density:'full'},classList:{remove:key=>classes.delete(key),toggle:(key,on)=>on?classes.add(key):classes.delete(key)},
  style:{getPropertyValue:key=>properties.get(key)??'',setProperty:(key,value)=>{writes++;properties.set(key,value);}},
  parentElement:{getBoundingClientRect:()=>({width:1100})}};
 const nav={textContent:'Applications sent 1'},offers={hidden:false};
 const ctx=vm.createContext({sidebarShell:shell,sidebar:nav,sidebarDensity:'full',sidebarPinned:false,
  sidebarPanel:{getBoundingClientRect:()=>{measurements++;return {width:shell.dataset.density==='compact'?130:200};}},
  innerWidth:1200,compactNavigation:{matches:false},columnWidths:{},fitColumnWidths:()=>({total:900}),
  $:id=>id==='offers-preset'?offers:{children:[]},
  document:{querySelector:()=>({offsetWidth:100,clientWidth:100})},getComputedStyle:()=>({columnGap:'0'}),
  requestAnimationFrame:fn=>{frames.push(fn);return frames.length;}});
 vm.runInContext(block('let sidebarSpaceFrame=', 'const sidebarSpaceObserver='),ctx);
 ctx.updateSidebarSpace();ctx.updateSidebarSpace();assert.equal(frames.length,1);
 frames.shift()();assert.equal(measurements,2);assert.equal(properties.get('--sidebar-panel-width'),'200px');
 assert.equal(properties.get('--sidebar-content-width'),'190px');assert(classes.has('labels-constrained'));
 const previousWrites=writes;
 ctx.updateSidebarSpace();frames.shift()();assert.equal(measurements,2,'Unchanged layout reuses intrinsic widths');
 assert.equal(writes,previousWrites,'Unchanged layout does not rewrite CSS widths');
 nav.textContent='Applications sent 1000';ctx.updateSidebarSpace();frames.shift()();
 assert.equal(measurements,4,'Count changes invalidate both cached label widths');
}
console.log('PASS: sidebar updates coalesce, reuse intrinsic measurements and invalidate changed counts.');
