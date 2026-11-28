import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import * as history from './status-history.mjs';
import {filterAndSort,APPLIED_TOTAL,INTERVIEW_TOTAL,OFFER_TOTAL} from './view-model.mjs';
import {defaultColumnLayout} from './column-layout.mjs';
const source=await readFile(new URL('./app.js',import.meta.url),'utf8');
const block=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
const elements=new Map();
const $=id=>{if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,classList:{toggle(){}}});return elements.get(id);};
let rendered=0,refreshed=0;
const filters={star:['Urgent']};
const jobs=[{id:'current',status:'Interview',applicationDate:'2026-11-10'},
 {id:'past',status:'Rejected',interviewDate:'2026-11-10'},
 {id:'pending',status:'Applied'}, {id:'offer',status:'Offer'}];
const context=vm.createContext({...history,APPLIED_TOTAL,INTERVIEW_TOTAL,OFFER_TOTAL,statuses:history.STATUS_VALUES,
 inProgressStatuses:['Applied','Interview','Offer'],data:{jobs},$,filters,
 updateSidebarLabel:()=>{},canChangeView:()=>true,hasUrgentFilter:()=>Boolean(filters.star),
 setCheckboxFilter:(key,values)=>{filters[key]=values;},render:()=>rendered++,refreshOpenFilter:()=>refreshed++});
vm.runInContext(block('const statusPresets=','const compactColumns=')+block('function refreshOverview(', 'function refreshUndoButton(')+block('function selectStatusPreset(', "$('status-presets').onclick="),context);
context.refreshOverview();assert.equal($('interviews-current').textContent,2);assert.equal($('interviews-preset').hidden,false);
context.selectStatusPreset({target:{closest:()=>({dataset:{statusPreset:'Interviews'}})}});
assert.deepEqual([...filters.status],['Interview','Offer']);assert.equal(filters.star,undefined);assert.equal(rendered,1);assert.equal(refreshed,1);
assert.deepEqual(new Set(filterAndSort(jobs,{filters}).map(job=>job.id)),new Set(['current','offer']));
jobs[0].status='Rejected';context.refreshOverview();assert.equal($('interviews-current').textContent,1);assert.equal($('interviews-preset').hidden,false);
jobs[3].status='Withdrawn';context.refreshOverview();assert.equal($('interviews-current').textContent,0);assert.equal($('interviews-preset').hidden,true);
const layout=defaultColumnLayout('Interviews');assert(layout.columns.includes('lastInterview'));assert.equal(layout.sort,'applicationDate');assert.equal(layout.direction,-1);
const html=await readFile(new URL('./index.html',import.meta.url),'utf8');
for(const id of ['interviews-preset','interviews-current'])assert.equal(html.split(`id="${id}"`).length-1,1,`${id} must be unique`);
assert(html.indexOf('data-status-preset="Interviews"')<html.indexOf('</nav>'));
assert(html.indexOf('data-status-preset="Interviews"')>html.indexOf('data-status-preset="In progress"'));
console.log('PASS: conditional current-interview count, nested placement, click filtering, urgency clearing and date-sorted independent layout.');
