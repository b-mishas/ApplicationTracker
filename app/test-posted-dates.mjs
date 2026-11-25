import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {tmpdir} from 'node:os';
import {normalizePostedDate as date,planPostedDates,migratePostedDates} from './migrate-posted-dates.mjs';
import {fixtureData} from './test-fixtures.mjs';

// Pin the fixture timezone; production follows the process local timezone.
process.env.TZ='Europe/Berlin';
assert.equal(date('3 days ago','2026-11-23T18:16:00Z'),'2026-11-20');
assert.equal(date('3 days ago (page of 2026-11-23)'),'2026-11-20');
assert.equal(date('vor 1 Tag','2026-11-10T23:30:00Z'),'2026-11-10');
assert.equal(date('Reposted 2 days ago','2026-03-02T12:00:00Z'),'2026-02-28');
assert.equal(date('18 hours ago','2026-11-10T05:00:00Z'),'2026-11-09');
assert.equal(date('18 hours ago'),'');
assert.equal(date('3 days ago'),'');
for(const text of ['<= 30 days','2 months ago','~2026-11-07 (Posted 3 days ago)','Closes 2026-11-17','2026-11 (PDF path)','2026-02-30','Not stated','3 days ago - 1 week ago','3 days ago (closes 2026-11-23)'])assert.equal(date(text),'',text);
for(const text of ['2026-11-02','02.11.2026','Nov 02, 2026','02 November 2026 (Last week)','Published 2026-11-02 (Workable)'])assert.equal(date(text),'2026-11-02',text);

assert.equal(date('3 days ago','not-a-timestamp'),'');
process.env.TZ='America/Los_Angeles';
assert.equal(date('1 day ago','2026-11-11T00:30:00Z'),'2026-11-09','Uses the process timezone, not Berlin');
process.env.TZ='Europe/Berlin';

const root=await fs.mkdtemp(path.join(tmpdir(),'tracker-posted-dates-'));
try{
 const source=fixtureData(),job=source.jobs[0];job.postedDate='3 days ago';
 job.sources=[{file:'2026-11-23-original.json'}];
 const raw=JSON.stringify(source);await fs.writeFile(path.join(root,'jobs.json'),raw);
 await fs.mkdir(path.join(root,'incoming','imported'),{recursive:true});
 await fs.writeFile(path.join(root,'incoming','imported','2026-11-23-original.json'),JSON.stringify({jobs:[{...job,observedAt:'2026-11-23T18:16:00Z'}]}));
 const preview=await migratePostedDates({root});assert.equal(preview.changes[0].after,'2026-11-20');
 assert.equal(await fs.readFile(path.join(root,'jobs.json'),'utf8'),raw);
 await assert.rejects(()=>migratePostedDates({root,apply:true}),/expected-revision/);
 await assert.rejects(()=>migratePostedDates({root,apply:true,expectedRevision:'stale'}),/changed/);
 assert.equal(await fs.readFile(path.join(root,'jobs.json'),'utf8'),raw);
 const applied=await migratePostedDates({root,apply:true,expectedRevision:preview.revision});assert(applied.written);
 assert.equal(await fs.readFile(path.join(root,applied.backup),'utf8'),raw);
 const actual=JSON.parse(await fs.readFile(path.join(root,'jobs.json'),'utf8'));
 const expected=structuredClone(source);expected.jobs[0].postedDate='2026-11-20';
 assert.deepEqual(actual.jobs,expected.jobs,'Only postedDate changes; user fields preserved');
 assert.equal(planPostedDates(actual).changes.length,0);
 assert.equal((await migratePostedDates({root})).changed,0);
}finally{await fs.rm(root,{recursive:true,force:true});}
console.log('Posting-date normalization, evidence, backup, stale revision and repeat-safety checks passed.');
