// Exercise field ownership without touching an inventory or starting a server.
import assert from 'node:assert/strict';
import {fieldsFor,fieldLabel,validateEntryChanges,applyEntryChanges} from './entry-editor.mjs';
import {renderEntryForm,readEntryChanges} from './entry-form.mjs';

const job={id:'fixture',status:'New',notes:'',url:'',sources:[],countries:['DE'],country:'DE',
 otherIds:['workday:jr4820'],postingUrls:['https://example.org/alias'],workModeBasis:'Posting reviewed'};
const before=structuredClone(job),markup=renderEntryForm(job);
for(const key of ['otherIds','postingUrls','country','workModeBasis']){
 assert(!fieldsFor(job).some(([field])=>field===key));
 assert(!markup.includes(`data-entry-field="${key}"`));
 assert.throws(()=>validateEntryChanges(job,{[key]:job[key]}),/read-only/);
}
for(const key of ['otherIds','postingUrls','country'])assert(!markup.includes(`<dt>${fieldLabel(key)}</dt>`));
assert(markup.includes('<dt>Work mode basis</dt><dd>Posting reviewed</dd>'));
assert(markup.includes('data-entry-field="countries"'));
assert(markup.includes('<h3 class="entry-sources-heading">Sources</h3>'));
// Extraction iterates only editable fields: protected fields need no DOM controls.
const changed=readEntryChanges({querySelectorAll:selector=>selector==='[data-entry-field]'?
 fieldsFor(job).map(([key,,type])=>({dataset:{entryField:key},value:key==='notes'?'Updated note':
 type==='countries'?'CH':type==='fit'?'':String(job[key]??''),checked:Boolean(job[key])})):[]},job);
validateEntryChanges(job,changed);
applyEntryChanges(job,changed,'2026-11-27');
assert.equal(job.notes,'Updated note');assert.equal(job.country,'CH');
assert.deepEqual(job.otherIds,before.otherIds);assert.deepEqual(job.postingUrls,before.postingUrls);
assert.equal(job.workModeBasis,before.workModeBasis);
assert(fieldsFor({...job,customField:'Keep editable'}).some(([key])=>key==='customField'));
console.log('PASS: internal aliases protected/hidden, evidence basis read-only, countries editable, draft extraction and saved aliases preserved.');
