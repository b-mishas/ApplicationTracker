// Offline checks of read-posting.mjs: which endpoint each posting URL maps to, and HTML to text.
import assert from 'node:assert/strict';
import {apiFor, strip} from './read-posting.mjs';

const ep = u => apiFor(u)?.url || null;
assert.equal(ep('https://jobs.ashbyhq.com/adaptyv/eda79fb3-7b4a-4fbf-87ce-0e23daef742f'), 'https://api.ashbyhq.com/posting-api/job-board/adaptyv');
assert.equal(ep('https://boards.greenhouse.io/schrdinger/jobs/7012345'), 'https://boards-api.greenhouse.io/v1/boards/schrdinger/jobs/7012345');
assert.equal(ep('https://apply.workable.com/tetrascience/j/B3416BD787/'), 'https://apply.workable.com/api/v2/accounts/tetrascience/jobs/B3416BD787');
assert.equal(ep('https://jobs.eu.lever.co/acme/1234-abcd'), 'https://api.eu.lever.co/v0/postings/acme/1234-abcd');
assert.equal(ep('https://embl.wd103.myworkdayjobs.com/EMBL/job/Heidelberg/Scientific-Officer_JR4820'), 'https://embl.wd103.myworkdayjobs.com/wday/cxs/embl/EMBL/job/Heidelberg/Scientific-Officer_JR4820');
assert.equal(ep('https://wd3.myworkdaysite.com/recruiting/hamilton/hamilton_jobs/job/Bonaduz/CSV-Engineer_JR-6026-1'), 'https://wd3.myworkdaysite.com/wday/cxs/hamilton/hamilton_jobs/job/Bonaduz/CSV-Engineer_JR-6026-1');
assert.equal(ep('https://careers.octapharma.com/job/Wien-Team-Lead/1459252033/'), null);
assert.equal(strip('<p>Tasks</p><ul><li>Lead &amp; plan</li></ul><script>x()</script><p>Profile</p>'), 'Tasks\n- Lead & plan\nProfile');
console.log('read-posting tests passed');
