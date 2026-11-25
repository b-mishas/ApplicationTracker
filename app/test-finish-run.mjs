import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {finishRun, previousRetry} from './finish-run.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'finish-run-'));
const runId = 'run-202611271715-ab12', folder = path.join(root, 'reports', 'runs', runId);
fs.mkdirSync(folder, {recursive: true});
const put = (name, value, dir = folder) => fs.writeFileSync(path.join(dir, name), Array.isArray(value) ? value.map(r => JSON.stringify(r)).join('\n') + '\n' : JSON.stringify(value));
const batch = `2026-11-27-${runId}.json`;
fs.writeFileSync(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: [
  {id: 'aaaaaaaa-1111', status: 'Shortlisted', company: 'Nordkamm', title: 'Lead Scientist'},
  {id: 'bbbbbbbb-2222', status: 'Shortlisted', company: 'Veltrum', title: 'Data Steward'},
  {id: 'cccccccc-3333', status: 'Dismissed', company: 'Old', title: 'Gone'},
  {id: 'dddddddd-4444', status: 'New', company: 'Kestrel', title: 'Principal Scientist', url: 'https://jobs.kestrel.test/p/1', linkType: 'posting', sources: [{label: 'Nature Careers', file: batch}]},
  {id: 'eeeeeeee-5555', status: 'New', company: 'Ardent', title: 'Head of LIMS', sources: [{label: 'LinkedIn alert', file: '2026-11-20-old.json'}, {label: 'LinkedIn alert', file: batch}]},
]}));
const coverageFile = path.join(root, 'reports', 'coverage.json');
fs.writeFileSync(coverageFile, JSON.stringify({updatedAt: 'x', dropped: [],
  refreshed: {'aaaaaaaa-1111': '2026-11-20', 'bbbbbbbb-2222': '2026-11-20', 'cccccccc-3333': '2026-11-01'}}));
put('run-ledger.jsonl', [
  {company: 'Kestrel', title: 'Principal Scientist', url: 'https://jobs.kestrel.test/p/1', state: 'assessed', basis: 'Posting reviewed', fit: 4},
  {company: 'Ardent GmbH', title: 'Head of LIMS', provider: 'linkedin', providerJobId: '4491000777', url: 'https://www.linkedin.com/comm/jobs/view/4491000777', state: 'excluded', basis: 'Posting reviewed', reason: 'low fit'},
  {company: 'Quill', title: 'Sales Lead', state: 'excluded', reason: 'sales'},
  {company: 'Moss', title: 'Data Lead', state: 'pending'},
  // Rated as reviewed, but no reading was recorded (23 Nov: five such lead reads).
  {company: 'Fjord', title: 'Lab Lead', url: 'https://fjord.test/jobs/9', state: 'excluded', basis: 'Posting reviewed', reason: 'level'},
  // A closure notice on a partial page supports Closed / Title only, not a fit rating.
  {company: 'Corvid', title: 'ELN Owner', url: 'https://corvid.test/jobs/3', state: 'excluded', basis: 'Posting reviewed', reason: 'closed'},
]);
put('read-0.jsonl', [
  {url: 'https://jobs.kestrel.test/p/1', company: 'Kestrel AG', advertisedTitle: 'Principal Scientist', text: 'partial'},
  {url: 'https://corvid.test/jobs/3', company: 'Corvid', advertisedTitle: 'ELN Owner', text: 'partial', closure: 'No longer accepting applications'},
]);
// The lead's own reread of the LinkedIn posting, under another company spelling and URL form.
put('read-lead.jsonl', [{url: 'https://www.linkedin.com/jobs/view/4491000777/', company: 'Ardent', advertisedTitle: 'Head of LIMS', text: 'full', by: 'lead'}]);
put('links-1.jsonl', [{title: 'Data Lead', company: 'Moss', found: false}, {title: 'X', company: 'Y', found: false, method: '3 searches', error: 'no employer page'}]);
put('refresh-1.jsonl', [
  {jobId: 'aaaaaaaa', company: 'Nordkamm', result: 'open', text: 'full'},
  {jobId: 'bbbbbbbb-2222', company: 'Veltrum', result: 'unconfirmed', text: 'none', error: 'page not rendered'},
  {jobId: 'zzzzzzzz', company: 'Ghost', result: 'open'},
]);
// Evidence order. Undated (older runs): a subagent's partial, then the lead's retry: the order is not established, so
// the source counts as partial and is retried, never as checked.
put('evidence-companies-A.jsonl', [{source: 'Selexis', kind: 'employer', status: 'partial'}, {source: 'Zifo', kind: 'employer', status: 'checked'}]);
put('source-evidence.jsonl', [{source: 'Gmail job-alerts', kind: 'alerts', status: 'checked'}, {source: 'Selexis', kind: 'employer', status: 'checked'},
  // Timestamped: a check that later failed for real stays failed, whatever the file order; offsets compare as instants.
  {source: 'Merus', kind: 'employer', status: 'checked', at: '2026-11-27T18:20:00+01:00'},
  // Mixed: an undated successful retry cannot be placed against a dated failure: flagged, not silently overridden.
  {source: 'Lonza', kind: 'employer', status: 'checked'},
  // Not a due employer: reported as a diagnostic, never as a company to retry.
  {source: 'Board script', kind: 'employer', status: 'deferred', at: '2026-11-27T17:05:00Z'},
  // Partial without an observed error: listed for one retry before the summary (JobTracker PLAN 1.4).
  {source: 'Evitria', kind: 'employer', status: 'partial', at: '2026-11-27T17:06:00Z'}]);
put('evidence-companies-B.jsonl', [{source: 'Merus', kind: 'employer', status: 'failed', error: 'HTTP 500', at: '2026-11-27T17:40:00Z'},
  {source: 'Lonza', kind: 'employer', status: 'failed', error: 'Workday 429', at: '2026-11-27T17:10:00Z'}]);
fs.utimesSync(path.join(folder, 'evidence-companies-A.jsonl'), new Date('2026-11-27T17:00:00Z'), new Date('2026-11-27T17:00:00Z'));
put('due.json', {employer: ['Selexis', 'Zifo', 'Merus', 'Lonza', 'Evitria'], portal: ['jobs.ch']});
const inputs = () => fs.readdirSync(folder).filter(n => n !== 'finish.json').map(n => fs.readFileSync(path.join(folder, n), 'utf8')).join('|');
const before = inputs();

const first = finishRun(root, runId, '2026-11-27');
assert.equal(first.searchCoverage, 'partial');
assert.deepEqual(first.import, {added: 1, addedBySource: {'Nature Careers': 1}});
assert.deepEqual(first.ledger, {finds: 6, assessed: 1, excluded: 4, pending: 1});
assert.deepEqual(first.reads.ratedWithoutFull, ['Kestrel | Principal Scientist | assessed', 'Corvid | ELN Owner | excluded']);
assert.deepEqual(first.reads.noAttemptRecord, ['Fjord | Lab Lead | excluded']);
assert.equal(first.reads.byLead, 1);
assert.deepEqual(first.linkFinder, {sent: 2, found: 0, notFound: 2, notFoundWithoutReason: 1});
assert.deepEqual(first.sources, {employer: {partial: 3, checked: 1, failed: 1, deferred: 1}, alerts: {checked: 1}});
assert.equal(first.evidence.find(e => e.source === 'Lonza').attempts.length, 2);
assert.deepEqual(first.diagnostics, ['employer Board script: deferred']);
assert.deepEqual(first.withoutError, ['employer Evitria: partial']);
// Order of source lines follows file write times; compare as a set.
assert.deepEqual([...first.retry].sort(), [
  'employer Selexis: partial (outcome order unknown: partial, checked)',
  'employer Merus: failed (HTTP 500)',
  'employer Evitria: partial',
  'employer Lonza: partial (outcome order unknown: failed, checked)',
  'portal jobs.ch: no evidence',
  'refresh Veltrum bbbbbbbb: unconfirmed (page not rendered)',
  'refresh zzzzzzzz: no Shortlisted record matches',
  'reread Kestrel | Principal Scientist | assessed',
  'reread Corvid | ELN Owner | excluded',
  'reread Fjord | Lab Lead | excluded | no reading recorded',
  'decide pending | run-202611271715-ab12 | Moss | Data Lead | Unknown',
].sort());
assert.equal(inputs(), before, 'input files unchanged');
// Refresh dates: confirmed only where the check confirmed; a legacy date counts as both; non-Shortlisted removed.
const coverage = () => JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
assert.deepEqual(coverage().refreshed, {
  'aaaaaaaa-1111': {lastAttemptedAt: '2026-11-27', lastConfirmedAt: '2026-11-27'},
  'bbbbbbbb-2222': {lastAttemptedAt: '2026-11-27', lastConfirmedAt: '2026-11-20'},
});
assert.equal(coverage().updatedAt, 'x');
assert.deepEqual(first.dropped, {added: 4, removed: 0, total: 4});
// A repeated call gives the same books.
const second = finishRun(root, runId, '2026-11-27');
assert.deepEqual({...second, finishedAt: 0, dropped: 0}, {...first, finishedAt: 0, dropped: 0});
assert.deepEqual(second.dropped, {added: 0, removed: 0, total: 4});

// Replaying an older run days later neither dates its refreshes by the replay day nor moves newer dates back.
const oldRun = 'run-202611231816-old1', oldFolder = path.join(root, 'reports', 'runs', oldRun);
fs.mkdirSync(oldFolder);
put('run-ledger.jsonl', [], oldFolder);
put('refresh-1.jsonl', [{jobId: 'aaaaaaaa', result: 'open'}, {jobId: 'bbbbbbbb', result: 'open'}], oldFolder);
// The saved 23 Nov row (Codex, 24 Nov): a script name is not an employer to retry.
put('source-evidence.jsonl', [{source: 'fetch-boards.mjs', kind: 'employer', status: 'deferred', method: 'board script run for 20 due companies'}, {source: 'Apollo Therapeutics', kind: 'employer', status: 'failed', error: 'client_error'}], oldFolder);
finishRun(root, oldRun, '2026-11-30');
assert.deepEqual(coverage().refreshed, {
  'aaaaaaaa-1111': {lastAttemptedAt: '2026-11-27', lastConfirmedAt: '2026-11-27'},
  'bbbbbbbb-2222': {lastAttemptedAt: '2026-11-27', lastConfirmedAt: '2026-11-23'},
});
// No due.json: coverage cannot be complete.
const oldFinish = JSON.parse(fs.readFileSync(path.join(oldFolder, 'finish.json'), 'utf8'));
assert.deepEqual(oldFinish.retry.slice(0, 2), ['employer Apollo Therapeutics: failed (client_error)', 'due.json missing: due sources not reconciled']);
assert.deepEqual(oldFinish.diagnostics, ['employer fetch-boards.mjs: deferred']);
// A partial without an observed error is listed for one retry before the summary (JobTracker PLAN 1.4).
assert.deepEqual(oldFinish.withoutError, []);
// Retry pickup (Codex, 24 Nov): a later folder without finish.json, such as a title triage recorded as a ledger only, must
// not hide the last search's retries.
const triage = path.join(root, 'reports', 'runs', 'run-202611281000-trg1');
fs.mkdirSync(triage);
put('run-ledger.jsonl', [{company: 'Pike', title: 'Data Steward', state: 'pending'}], triage);
put('run-completion.json', {runId: 'run-202611281000-trg1', status: 'finished'}, triage);
assert.deepEqual(previousRetry(root, 'run-202611301815-next'), {from: runId, retry: first.retry});
assert.equal(previousRetry(root, 'run-202611250000-midd').from, oldRun);
assert.deepEqual(previousRetry(root, 'run-202611010000-firs'), {from: null, retry: []});
// Codex review: no sources due and an assessed vacancy never imported is not a complete run.
const lone = fs.mkdtempSync(path.join(os.tmpdir(), 'finish-run-open-')), loneRun = 'run-202611281200-solo';
fs.mkdirSync(path.join(lone, 'reports', 'runs', loneRun), {recursive: true});
fs.writeFileSync(path.join(lone, 'jobs.json'), JSON.stringify({jobs: []}));
fs.writeFileSync(path.join(lone, 'reports', 'coverage.json'), JSON.stringify({}));
put('due.json', {employer: [], portal: []}, path.join(lone, 'reports', 'runs', loneRun));
put('run-ledger.jsonl', [{company: 'Pike', title: 'Data Lead', location: 'Bern', state: 'assessed', basis: 'Title only', fit: 4}, {company: 'Ruff', title: 'Analyst', location: 'Basel'}], path.join(lone, 'reports', 'runs', loneRun));
const solo = finishRun(lone, loneRun, '2026-11-28');
assert.equal(solo.searchCoverage, 'partial');
assert.deepEqual(solo.retry, ['import assessed, not imported | run-202611281200-solo | Pike | Data Lead | Bern', 'repair no state | run-202611281200-solo | Ruff | Analyst | Basel']);
fs.rmSync(lone, {recursive: true, force: true});
fs.rmSync(root, {recursive: true, force: true});
console.log('finish-run tests passed');
