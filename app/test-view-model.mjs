import assert from 'node:assert/strict';
import {filterAndSort,choicesFor,EMPTY,REJECTED_AFTER_INTERVIEW,APPLIED_TOTAL,INTERVIEW_TOTAL,OFFER_TOTAL} from './view-model.mjs';
import {STATUS_VALUES,isRejectedAfterInterview,hasSentApplication,hasCurrentOffer,interviewDetails,updateStage,interviewHistoryText} from './status-history.mjs';
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
const afterInterview=['after-interview','old-history'];
assert.deepEqual(rejectionJobs.filter(isRejectedAfterInterview).map(job=>job.id),afterInterview);
assert.deepEqual(choicesFor(rejectionJobs[1],'status'),['Rejected',REJECTED_AFTER_INTERVIEW,APPLIED_TOTAL,INTERVIEW_TOTAL]);
const rejectionIds=selected=>filterAndSort(rejectionJobs,{filters:{status:selected}}).map(job=>job.id);
assert.deepEqual(rejectionIds([REJECTED_AFTER_INTERVIEW]),afterInterview);
assert.deepEqual(rejectionIds(['Rejected']),['direct','after-interview','old-outcome','old-history','unknown-interview-date','offer-without-interview']);
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

const sentJobs=[
 {id:'new',status:'New'}, {id:'shortlisted',status:'Shortlisted'},
 ...['Applied','Interview','Offer','Rejected','Withdrawn'].map(status=>({id:status,status})),
 {id:'dismissed',status:'Dismissed'},
 {id:'dated',status:'Dismissed',applicationDate:'2026-11-01'},
 {id:'history',status:'New',statusHistory:[{status:'Applied',date:'2026-11-01'}]},
 {id:'interview-history',status:'Dismissed',interviewDate:''},
 {id:'empty-date',status:'New',applicationDate:''}
];
const sentIds=['Applied','Interview','Offer','Rejected','Withdrawn','dated','history'];
assert.deepEqual(sentJobs.filter(hasSentApplication).map(job=>job.id),sentIds);
assert.deepEqual(new Set(filterAndSort(sentJobs,{filters:{status:[APPLIED_TOTAL]}}).map(job=>job.id)),new Set(sentIds));
assert.deepEqual(filterAndSort(sentJobs,{filters:{status:[APPLIED_TOTAL]},search:'nothing'}),[]);
assert.equal(filterAndSort(sentJobs,{filters:{status:STATUS_VALUES}}).length,sentJobs.length);
console.log('PASS: total sent applications include all outcomes and historic records, exclude unsent entries and respect other filters.');

const interviewJobs=[
 {id:'pending',status:'Interview'},
 {id:'rejected',status:'Rejected',interviewDate:'2026-11-01'},
 {id:'offer',status:'Offer',interviewDate:''},
 {id:'withdrawn',status:'Withdrawn',interviewOutcome:'Withdrawn'},
 {id:'legacy',status:'Dismissed',statusHistory:[{status:'Interview',date:'2026-11-01'}]},
 {id:'reapplied',status:'Applied',interviewDate:'2026-11-01'},
 {id:'direct-rejection',status:'Rejected'},
 {id:'direct-offer',status:'Offer'},
 {id:'only-applied',status:'Applied'}
];
const interviewIds=selected=>filterAndSort(interviewJobs,{filters:{status:selected}}).map(job=>job.id);
assert.deepEqual(new Set(interviewIds([INTERVIEW_TOTAL])),new Set(['rejected','legacy','reapplied']));
assert.deepEqual(interviewIds(['Interview']),['pending']);
assert.equal(interviewIds(STATUS_VALUES).length,interviewJobs.length);
assert.equal(interviewIds([...STATUS_VALUES,APPLIED_TOTAL,INTERVIEW_TOTAL,REJECTED_AFTER_INTERVIEW]).length,interviewJobs.length);
assert.deepEqual(filterAndSort(interviewJobs,{filters:{status:[INTERVIEW_TOTAL],company:'absent'}}),[]);
console.log('PASS: total interviews include recorded current/legacy interviews across outcomes, retain pending-only filtering and exclude unrecorded interviews.');

const offerJobs=[
 {id:'current',status:'Offer',offerDate:''},
 {id:'outcome',status:'Interview',interviewOutcome:'Offer'},
 {id:'withdrawn',status:'Withdrawn',offerDate:'2026-11-14'},
 {id:'legacy',status:'Dismissed',statusHistory:[{status:'Offer',date:'2026-11-14'}]},
 {id:'empty',status:'Applied',offerDate:''},
 {id:'interview-only',status:'Interview'},
 {id:'new',status:'New'}
];
const offered=['current','outcome'];
assert.deepEqual(offerJobs.filter(hasCurrentOffer).map(job=>job.id),offered);
assert.deepEqual(new Set(filterAndSort(offerJobs,{filters:{status:[OFFER_TOTAL]}}).map(job=>job.id)),new Set(offered));
assert.deepEqual(filterAndSort(offerJobs,{filters:{status:[OFFER_TOTAL]},search:'no-match'}),[]);
assert.equal(filterAndSort(offerJobs,{filters:{status:STATUS_VALUES}}).length,offerJobs.length);
console.log('PASS: Offers includes current Offer even without a date, excludes historical/withdrawn offers and respects search/All.');

// A modern cleared date overrides old dated history, including later outcomes.
const legacyMilestones={status:'Rejected',statusHistory:[{status:'Interview',date:'2026-11-10'},{status:'Offer',date:'2026-11-12'}]};
assert.equal(interviewDetails(legacyMilestones).hasInterview,true);
assert.equal(hasCurrentOffer(legacyMilestones),false);
const clearedMilestones={...legacyMilestones,interviewDate:'',offerDate:''};
assert.equal(interviewDetails(clearedMilestones).hasInterview,false);
assert.equal(hasCurrentOffer(clearedMilestones),false);
assert.equal(isRejectedAfterInterview(clearedMilestones),false);
assert.equal(interviewHistoryText(clearedMilestones),'');
for(const status of ['New','Shortlisted','Applied']){
 const job={...legacyMilestones};
 updateStage(job,{status},'2026-11-17');
 assert.equal(job.interviewDate,'');assert.equal(job.offerDate,'');
 assert.equal(interviewDetails(job).hasInterview,false);assert.equal(hasCurrentOffer(job),false);
 assert.equal(filterAndSort([job],{filters:{status:[INTERVIEW_TOTAL,OFFER_TOTAL]}}).length,0);
}
const correction={status:'Applied'};
updateStage(correction,{status:'Interview'},'2026-11-17');
assert.equal(correction.interviewDate,'2026-11-17');
updateStage(correction,{status:'Interview',interviewDate:''},'2026-11-17');
updateStage(correction,{status:'Interview'},'2026-11-18');
assert.equal(correction.interviewDate,'');assert.equal(interviewDetails(correction).hasInterview,false);
updateStage(correction,{status:'Applied'},'2026-11-18');
updateStage(correction,{status:'Interview'},'2026-11-19');
assert.equal(correction.interviewDate,'2026-11-19');
updateStage(correction,{status:'Offer'},'2026-11-20');
updateStage(correction,{status:'Withdrawn'},'2026-11-21');
assert.equal(hasCurrentOffer(correction),false);
updateStage(correction,{status:'Withdrawn',offerDate:''},'2026-11-21');
assert.equal(hasCurrentOffer(correction),false);
console.log('PASS: empty dates override legacy history; backwards corrections clear milestones; notes do not restore cleared dates; entering a new stage records its date.');
