import assert from 'node:assert/strict';
import {filterAndSort,choicesFor,EMPTY,REJECTED_AFTER_INTERVIEW} from './view-model.mjs';
import {STATUS_VALUES,isRejectedAfterInterview} from './status-history.mjs';
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

const rejectionJobs=[
 {id:'direct',status:'Rejected'},
 {id:'after-interview',status:'Rejected',interviewDate:'2026-11-03',interviewOutcome:'Rejected'},
 {id:'old-outcome',status:'Interview',interviewOutcome:'Rejected'},
 {id:'old-history',status:'Rejected',statusHistory:[{status:'Interview',date:'2026-11-03'},{status:'Rejected',date:'2026-11-05'}]},
 {id:'unknown-interview-date',status:'Rejected',interviewDate:''},
 {id:'offer-without-interview',status:'Rejected',offerDate:'2026-11-04'},
 {id:'reapplied',status:'Applied',interviewDate:'2026-11-03',interviewOutcome:'Rejected'},
 {id:'withdrawn-after-interview',status:'Withdrawn',interviewDate:'2026-11-03',interviewOutcome:'Withdrawn'}
];
const afterInterview=['after-interview','old-outcome','old-history','unknown-interview-date'];
assert.deepEqual(rejectionJobs.filter(isRejectedAfterInterview).map(job=>job.id),afterInterview);
assert.deepEqual(choicesFor(rejectionJobs[1],'status'),['Rejected',REJECTED_AFTER_INTERVIEW]);
const rejectionIds=selected=>filterAndSort(rejectionJobs,{filters:{status:selected}}).map(job=>job.id);
assert.deepEqual(rejectionIds([REJECTED_AFTER_INTERVIEW]),afterInterview);
assert.deepEqual(rejectionIds(['Rejected']),['direct',...afterInterview,'offer-without-interview']);
assert.deepEqual(rejectionIds(['Rejected',REJECTED_AFTER_INTERVIEW]),rejectionIds(['Rejected']));
assert.deepEqual(rejectionIds(STATUS_VALUES),rejectionJobs.map(job=>job.id));
assert.deepEqual(rejectionIds([...STATUS_VALUES,REJECTED_AFTER_INTERVIEW]),rejectionIds(STATUS_VALUES));
assert.deepEqual(rejectionIds(STATUS_VALUES.filter(status=>!['Rejected','Dismissed','Withdrawn'].includes(status))),['reapplied']);
console.log('PASS: interview-rejection subgroup recognizes current and legacy records, excludes stale interview outcomes, preserves the overall Rejected group and works with All/Reset selections.');

// Empty selections keep the one-click default; positive selections still filter.
for(const key of ['group','country','fit','status','workMode','assessmentBasis','star']){
 assert.deepEqual(ids({filters:{[key]:[]}}),ids({}),key+' empty selection is unfiltered');
 const all=[...new Set(jobs.flatMap(job=>choicesFor(job,key)))];
 assert.deepEqual(ids({filters:{[key]:all}}),ids({}),key+' all selected');
}
assert.deepEqual(rejectionIds([]),rejectionIds(STATUS_VALUES));
assert.deepEqual(ids({filters:{group:[],country:['DE']}}),ids({filters:{country:['DE']}}));
console.log('PASS: unchecked/default, Clear and All selections are unfiltered; other column filters still apply, including missing values and interview rejections.');
