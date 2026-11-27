// Exercise real transactions against disposable data, never the live inventory.
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,readdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {fixtureData,fixtureSettings} from './test-fixtures.mjs';
import {applyEntryChanges,validateEntryChanges,fieldLabel,fieldsFor,displayValue} from './entry-editor.mjs';
import {renderEntryForm,renderRowControl,readEntryChanges,fitTextHeights,sourcesForEditor} from './entry-form.mjs';

const fixtures=fixtureData();
fixtures.jobs[0].customField={retain:['evidence',42]};
fixtures.jobs[0].sources[0].capturedAt='2026-11-02T10:00:00Z';
fixtures.jobs[0].statusHistory=[{id:'legacy',status:'Applied',date:'2026-11-01'}];
fixtures.jobs[0].applicationCity='Historical export city';
fixtures.jobs[0].workModeBasis='Posting reviewed';
for(const key of ['lastObservedAt','assessedAt','workModeAt','availabilityAt'])fixtures.jobs[0][key]='2026-11-25T10:00:00Z';
const original=structuredClone(fixtures.jobs[0]);
const withoutTimestamp=({updatedAt,...job})=>job;
const directory=await mkdtemp(path.join(tmpdir(),'entry-editor-'));
let server;
try{
 await writeFile(path.join(directory,'jobs.json'),JSON.stringify(fixtures));
 await writeFile(path.join(directory,'settings.json'),JSON.stringify(fixtureSettings));
 server=spawn(process.execPath,[fileURLToPath(new URL('./server.mjs',import.meta.url))],{env:{...process.env,PORT:'0',JOBTRACKER_DATA_DIR:directory,JOBTRACKER_SETTINGS_FILE:path.join(directory,'settings.json')},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{
  let output='';server.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);if(match)resolve(match[0]);});
  server.once('error',reject);server.once('exit',code=>reject(Error('Server exited: '+code)));server.stderr.on('data',chunk=>reject(Error(String(chunk))));
 });
 const state=async()=> (await fetch(base+'/api/jobs')).json();
 const patch=payload=>fetch(base+'/api/jobs',{method:'PATCH',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(payload)});
 const initial=await state();
 const changes={company:'Edited company',title:'Edited role',fit:null,group:'Computational',countries:['CH','DE'],reasoning:'A manual assessment',notes:'Manual note',postedDate:'2026-11-21',firstSeen:'2026-10-31',url:'https://example.org/primary',sources:[{...original.sources[0],label:'Changed label',url:'https://example.org/one'},{label:'Second listing',url:'https://example.org/two',file:''}],customField:{retain:['edited',43]}};
 const response=await patch({id:original.id,revision:initial.revision,changes});
 assert.equal(response.status,200);const edited=await response.json();
 for(const [key,value] of Object.entries(changes))assert.deepEqual(edited.job[key],value);
 assert.equal(edited.job.country,'CH, DE');
 assert.equal(edited.job.id,original.id);assert.equal(edited.job.firstSeen,changes.firstSeen);
 assert.deepEqual(edited.job.statusHistory,original.statusHistory);
 assert.deepEqual((await state()).data.jobs[1],fixtures.jobs[1]);
 const backups=await readdir(path.join(directory,'backups'));assert.equal(backups.length,1);
 assert.deepEqual(JSON.parse(await readFile(path.join(directory,'backups',backups[0]),'utf8')).jobs[0],original);
 assert.equal((await patch({id:original.id,revision:initial.revision,changes:{notes:'Stale write'}})).status,409);
 const noOp=await patch({id:original.id,revision:edited.revision,changes:{notes:changes.notes}});
 assert.equal(noOp.status,200);assert.equal((await noOp.json()).undoToken,undefined);
 assert.equal((await readdir(path.join(directory,'backups'))).length,1);
 const undoneResponse=await patch({id:original.id,revision:edited.revision,quickAction:'undo',undoToken:edited.undoToken});
 assert.equal(undoneResponse.status,200);const undone=await undoneResponse.json();
 assert.deepEqual(withoutTimestamp(undone.job),original);
 assert.equal((await patch({id:original.id,revision:undone.revision,quickAction:'undo',undoToken:edited.undoToken})).status,409);
 console.log('PASS: multiple fields/URLs save atomically, preserve evidence and unrelated data, make a backup, reject stale writes and undo together.');

 const invalid=[null,[],{id:'replacement'},{updatedAt:'fake'},{firstSeen:'2026-02-30'},{country:'DE'},{bogus:'x'},JSON.parse('{"__proto__":{}}'),{company:''},{group:42},{fit:6},{fit:'4'},{status:'Unknown'},{postedDate:'2026-02-30'},{applicationDate:'yesterday'},{offerDate:null},{countries:['DE','DE']},{countries:['XX']},{url:'javascript:alert(1)'},{sources:'invalid'},{sources:[{label:'A',url:'ftp://example.org',file:''}]},{sources:[{label:'',url:'https://example.org',file:''}]},{statusHistory:[{id:'a',status:'Interview',date:'2026-02-30'}]},{customField:[]},{notes:'a'.repeat(50001)}];
 const raw=await readFile(path.join(directory,'jobs.json'),'utf8');
 for(const changes of invalid){
  const result=await patch({id:original.id,revision:undone.revision,changes});
  assert.equal(result.status,400,JSON.stringify(changes));
  assert.equal(await readFile(path.join(directory,'jobs.json'),'utf8'),raw);
 }
 assert.equal((await patch({id:original.id,revision:undone.revision,changes:{notes:'x'},quickAction:'urgent',urgent:true})).status,400);
 assert.equal((await fetch(base+'/api/jobs',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:original.id,revision:undone.revision,changes:{notes:'x'}})})).status,403);
 for(const url of ['/entry-editor.mjs','/entry-form.mjs','/status-history.mjs']){
  const response=await fetch(base+url);assert.equal(response.status,200,url);
  assert.match(response.headers.get('content-type'),/^text\/javascript/);
 }
 console.log('PASS: protected fields, invalid types/dates/URLs/countries/history, oversized notes and mixed requests are rejected without writes.');

 // Historical evidence may have a filename without a web URL.
 const historical={...original,url:'',sources:[{label:'Workbook',url:'',file:'history.xlsx',capturedAt:'retained'}]};
 applyEntryChanges(historical,{notes:'Corrected without a URL'},'2026-11-26');
 assert.equal(historical.url,'');
 const evidence=[{...historical.sources[0],label:'Renamed workbook'},{label:'New posting',url:'https://example.org/new',file:''}];
 applyEntryChanges(historical,{sources:evidence},'2026-11-26');
 assert.equal(historical.sources[0].capturedAt,'retained');
 assert.throws(()=>validateEntryChanges(historical,{sources:[{label:'New blank source',url:'',file:''}]}),/http/);
 assert.throws(()=>validateEntryChanges(historical,{sources:[{...evidence[0],url:'javascript:alert(1)'}]}),/http/);
 validateEntryChanges(original,{url:'',sources:[]});
 const transition=structuredClone(original);
 applyEntryChanges(transition,{interviewOutcomeDate:'2026-11-24'},'2026-11-25');assert.equal(transition.interviewOutcomeDate,'2026-11-24');
 applyEntryChanges(transition,{status:'Applied'},'2026-11-25');assert.equal(transition.applicationDate,'2026-11-25');
 applyEntryChanges(transition,{status:'Interview',interviewDate:'2026-11-26',applicationStatusText:'My wording'},'2026-11-25');
 applyEntryChanges(transition,{notes:'Changed notes'},'2026-11-25');assert.equal(transition.applicationStatusText,'My wording');
 applyEntryChanges(transition,{status:'Offer',offerDate:'2026-11-27'},'2026-11-25');assert.equal(transition.applicationStatusText,undefined);
 applyEntryChanges(transition,{status:'Applied'},'2026-11-25');assert.equal(transition.interviewDate,'');assert.equal(transition.offerDate,'');
 const legacy={...original,postedDate:'legacy date',legacyNull:null};
 applyEntryChanges(legacy,{notes:'Legacy preserved'},'2026-11-25');assert.equal(legacy.postedDate,'legacy date');assert.equal(legacy.legacyNull,null);
 assert.throws(()=>validateEntryChanges(original,{statusHistory:[]}),/read-only/);
 assert(!renderEntryForm(original).includes('data-entry-field="statusHistory"'));
 assert(!renderEntryForm(original).includes('Legacy status history'));
 validateEntryChanges(original,{sources:[]});
 const injection={...original,company:'<img src=x onerror=alert(1)>',sources:[{label:'<script>',url:'javascript:alert(1)',file:'<file>'}]};
 assert(!renderEntryForm(injection).includes('<img'));assert(!renderEntryForm(injection).includes('<script>'));
 assert(renderEntryForm(original).includes('data-entry-field="customField"'));assert(!renderEntryForm(original).includes('data-entry-field="id"'));
 assert(renderEntryForm(legacy).includes('value="legacy date"'));
 const editorMarkup=renderEntryForm(original);
 assert(!editorMarkup.includes('data-entry-field="workModeBasis"'));
 assert(editorMarkup.includes('<dt>Work mode basis</dt><dd>Posting reviewed</dd>'));
 assert.equal((editorMarkup.match(/data-entry-field="urgent"/g)||[]).length,1);
 assert(editorMarkup.includes('<div class="entry-urgent-line"><label'));
 assert(!editorMarkup.slice(0,editorMarkup.indexOf('<details')).includes('data-entry-field="locationRaw"'));
 assert(editorMarkup.slice(editorMarkup.indexOf('<details')).includes('data-entry-field="locationRaw"'));
 assert(renderRowControl(original,'country').includes('data-entry-row-field="countries"'));
 assert(renderRowControl(original,'city').includes('data-entry-row-field="city"'));
 assert(renderRowControl(original,'lastInterview').includes('data-entry-row-field="interviewDate"'));
 assert(renderRowControl(original,'firstSeen').includes('data-entry-row-field="firstSeen"'));
 assert(renderEntryForm(original).includes('data-entry-field="firstSeen"'));
 assert.equal(renderRowControl(original,'star'),null);
 assert(!renderRowControl(injection,'company').includes('<img'));
 assert.equal(fieldLabel('lastObservedAt'),'Last observed at');
 assert.equal(fieldLabel('applicationSourceRow'),'Application source row');
 assert.equal(fieldLabel('providerJobId'),'Provider job ID');
 assert.equal(fieldLabel('id'),'ID');
 assert(renderRowControl(original,'group').includes('type="text"'));
 validateEntryChanges(original,{group:'Custom group'});
 assert(!renderEntryForm(original).includes('data-entry-field="applicationCity"'));
 assert(!renderEntryForm(original).includes('Historical export city'));
 for(const key of ['lastObservedAt','assessedAt','workModeAt','availabilityAt']){
  assert(!renderEntryForm(original).includes(`data-entry-field="${key}"`));
  assert(!renderEntryForm(original).includes(`<dt>${fieldLabel(key)}</dt>`));
  assert.throws(()=>validateEntryChanges(original,{[key]:'2026-11-26T10:00:00Z'}),/read-only/);
 }
 const repeatedSource={...original,url:'https://jobs.ashbyhq.com/cradlebio/example-id',sources:[
  {label:'LinkedIn backlog',url:'https://www.linkedin.com/jobs/search/?keywords=Cradle',file:'backlog.xlsx'},
  {label:'Employer career site',url:'https://jobs.ashbyhq.com/cradlebio/example-id',file:'verification.json'},
  {label:'Employer career site (refresh)',url:'https://jobs.ashbyhq.com/cradlebio/example-id',file:'refresh.json'}
 ]};
 assert.equal((renderEntryForm(repeatedSource).match(/data-source-index=/g)||[]).length,3);
 assert.equal((renderEntryForm(repeatedSource).match(/data-source-primary/g)||[]).length,3);
 assert.equal(sourcesForEditor(repeatedSource).filter(row=>row.primary).length,1);
 assert.equal(sourcesForEditor(repeatedSource).find(row=>row.primary).index,1);
 assert(!renderEntryForm(repeatedSource).includes('Primary listing URL'));
 assert(renderEntryForm(repeatedSource).includes('type="hidden" data-entry-field="url"'));
 assert.equal((renderEntryForm(repeatedSource).match(/title="Remove source"/g)||[]).length,3);
 assert.equal((renderEntryForm(repeatedSource).match(/aria-hidden="true">×<\/span>/g)||[]).length,3);
 assert(!renderEntryForm(repeatedSource).includes('data-source-field="file"'));
 assert(!renderEntryForm(repeatedSource).includes('backlog.xlsx'));
 assert(!renderEntryForm(repeatedSource).includes('Evidence file'));
 assert.deepEqual(fitTextHeights([50,80],[40,40],200),[50,80]);
 assert.deepEqual(fitTextHeights([1000,1000],[40,40],300),[150,150]);
 assert.deepEqual(fitTextHeights([60,1000],[40,40],300),[60,240]);
 assert.deepEqual(fitTextHeights([1000,1000],[40,40],30),[40,40]);
 // The form no longer has an evidence-file input. Extraction must retain the
 // original provenance and supply an empty filename only for new sources.
 const controls=fieldsFor(original).map(([key,,type])=>{
  const value=displayValue(original,key);
  return {dataset:{entryField:key},checked:Boolean(value),value:type==='countries'?(value||[]).join(', '):type==='json'?(value===undefined?'':JSON.stringify(value,null,2)):String(value??'')};
 });
 const sourceDraft=(index,label,url)=>({dataset:{sourceIndex:String(index)},querySelectorAll:()=>[
  {dataset:{sourceField:'label'},value:label},{dataset:{sourceField:'url'},value:url}
 ]});
 const draftForm={querySelectorAll:selector=>selector==='[data-entry-field]'?controls:selector==='[data-source-index]'?[
  sourceDraft(0,'Updated label',original.sources[0].url),sourceDraft(-1,'Added source','https://example.org/added')
 ]:[]};
 const extracted=readEntryChanges(draftForm,original);
 assert.equal(extracted.sources[0].file,original.sources[0].file);
 assert.equal(extracted.sources[0].capturedAt,original.sources[0].capturedAt);
 assert.equal(extracted.sources[1].file,'');
 validateEntryChanges(original,extracted);
 assert.equal((renderEntryForm(repeatedSource).match(/data-source-field="url"[^>]*value="https:\/\/jobs.ashbyhq.com\/cradlebio\/example-id"/g)||[]).length,2);
 const missingPrimary={...original,url:'https://example.org/missing-primary'};
 const editorRows=sourcesForEditor(missingPrimary);
 assert.equal(editorRows.length,original.sources.length+1);
 assert.equal(editorRows.find(row=>row.primary).index,-2);
 const missingControls=controls.map(control=>control.dataset.entryField==='url'?{...control,value:missingPrimary.url}:control);
 const missingForm={querySelectorAll:selector=>selector==='[data-entry-field]'?missingControls:selector==='[data-source-index]'?[
  sourceDraft(0,original.sources[0].label,original.sources[0].url),sourceDraft(-2,'Primary listing',missingPrimary.url)
 ]:[]};
 assert.deepEqual(readEntryChanges(missingForm,missingPrimary),{},'opening a missing primary must not change sources');
 missingControls.find(control=>control.dataset.entryField==='notes').value='An unrelated edit';
 assert.deepEqual(readEntryChanges(missingForm,missingPrimary),{notes:'An unrelated edit'});
 missingControls.find(control=>control.dataset.entryField==='url').value=original.sources[0].url;
 const switchedPrimary=readEntryChanges(missingForm,missingPrimary);
 assert.equal(switchedPrimary.url,original.sources[0].url);
 assert(switchedPrimary.sources.some(source=>source.url===missingPrimary.url),'switching primary preserves the previous link');
 console.log('PASS: stage transitions, generated/manual application text, milestone rollback, legacy preservation, advanced fields and escaped rendering.');
}finally{
 if(server&&server.exitCode===null){const stopped=new Promise(resolve=>server.once('exit',resolve));server.kill();await stopped;}
 await rm(directory,{recursive:true,force:true,maxRetries:5});
}
