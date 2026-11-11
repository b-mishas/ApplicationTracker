import assert from 'node:assert/strict';
import {filterAndSort,EMPTY} from './view-model.mjs';
const jobs=[
 {id:'a',company:'Alpha',title:'Lead',group:'ELN/LIMS',countries:['DE'],status:'New',fit:2,firstSeen:'2026-11-02'},
 {id:'b',company:'Beta',title:'Scientist',group:'Computational',countries:['CH','DE'],status:'Shortlisted',fit:4,firstSeen:'2026-11-03'},
 {id:'c',company:'Zeta',title:'Scientist',group:'Computational',countries:['UK'],status:'Dismissed',fit:5,firstSeen:'2026-11-03'},
 {id:'d',company:'Aardvark',title:'Other',group:'',countries:[],status:'Dismissed',fit:null,firstSeen:'2026-10-01'}
];
const ids=o=>filterAndSort(jobs,o).map(j=>j.id);
for(const sort of ['fit','company','title','group','country','status','star','firstSeen'])for(const direction of [1,-1]){
 const list=filterAndSort(jobs,{sort,direction});assert(list.slice(0,2).every(j=>j.status!=='Dismissed'));assert(list.slice(2).every(j=>j.status==='Dismissed'));
}
assert.deepEqual(ids({sort:'company',direction:1}),['a','b','d','c']);
assert.deepEqual(ids({sort:'company',direction:-1}),['b','a','c','d']);
assert.deepEqual(ids({filters:{group:['ELN/LIMS','Computational'],country:['DE'],firstSeen:'2026-11-03'}}),['b']);
assert.deepEqual(ids({filters:{group:['Computational'],country:['CH','UK']}}),['b','c']);
assert.deepEqual(ids({filters:{group:[EMPTY],country:[EMPTY]}}),['d']);
assert.deepEqual(ids({filters:{star:['Shortlisted','Dismissed']}}),['b','c','d']);
assert.deepEqual(ids({filters:{status:['Dismissed']},sort:'company',direction:1}),['d','c']);
assert.deepEqual(ids({filters:{title:'sci',fit:['4','5']}}),['b','c']);
assert.deepEqual(ids({filters:{status:['Shortlisted']},search:'beta'}),['b']);
const urgentJobs=jobs.map(job=>({...job,urgent:['a','c'].includes(job.id)}));
const urgentIds=options=>filterAndSort(urgentJobs,options).map(job=>job.id);
assert.deepEqual(urgentIds({filters:{star:['Urgent']}}),['a','c']);
assert.deepEqual(urgentIds({filters:{star:['Urgent','Shortlisted']},sort:'star',direction:-1}),['a','b','c']);
assert.deepEqual(urgentIds({sort:'star',direction:-1}),['a','b','c','d']);
assert.deepEqual(urgentIds({sort:'star',direction:1}),['b','a','d','c']);
console.log('PASS: dismissed priority in every sort direction, multi-group/country OR filtering, combined AND filters, empty values, text/fit/date/status/selection filters.');

const ties=[
 {id:'low',status:'New',urgent:false,fit:2,company:'Same'},
 {id:'unknown',status:'New',urgent:false,fit:null,company:'Same'},
 {id:'high',status:'New',urgent:false,fit:5,company:'Same'},
 {id:'urgent-low',status:'New',urgent:true,fit:3,company:'Same'},
 {id:'urgent-high',status:'New',urgent:true,fit:4,company:'Same'}
];
assert.deepEqual(filterAndSort(ties,{sort:'star',direction:-1}).map(j=>j.id),['urgent-high','urgent-low','high','low','unknown']);
for(const direction of [-1,1]){
 assert.deepEqual(filterAndSort(ties,{sort:'company',direction}).map(j=>j.id),['high','urgent-high','urgent-low','low','unknown']);
}
console.log('PASS: fit descending breaks equal primary values, including urgent groups and unknown fit.');

const applications=[
 {id:'older-high',status:'Interview',interviewOutcome:'Offer',applicationDate:'2026-10-30',fit:5},
 {id:'unknown',status:'Applied',fit:5},
 {id:'newest',status:'Applied',applicationDate:'2026-11-03',fit:2},
 {id:'empty',status:'Offer',applicationDate:'',fit:3},
 {id:'older-low',status:'Interview',applicationDate:'2026-10-30',fit:3},
 {id:'rejected',status:'Interview',interviewOutcome:'Rejected',applicationDate:'2026-11-04',fit:4}
];
const progressOptions={filters:{status:['Applied','Interview','Offer']},sort:'applicationDate',direction:-1};
assert.deepEqual(filterAndSort(applications,progressOptions).map(job=>job.id),['newest','older-high','older-low','unknown','empty']);
assert.deepEqual(filterAndSort(applications,{...progressOptions,direction:1}).map(job=>job.id),['older-high','older-low','newest','unknown','empty']);
assert.deepEqual(filterAndSort(applications,{...progressOptions,filters:{...progressOptions.filters,applicationDate:'2026-11-01'}}).map(job=>job.id),['newest']);
console.log('PASS: application dates sort chronologically with missing dates last, retain Fit tie-breaking and filter by applied-on date and effective status.');
