import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initializeRun, readRun, updateTasks, outstanding, profileRevision, summarizeRun} from './run-state.mjs';
import {readLedger, changeLedger, initializeLedger} from './candidate-ledger.mjs';
import {importBatch} from './import-discoveries.mjs';
import {commit} from './store.mjs';

const cli = fileURLToPath(new URL('./run-state.mjs', import.meta.url));
const job = n => ({company: 'Example', title: `Engineer ${n}`, url: `https://example.test/jobs/${n}`, provider: 'ATS', providerJobId: String(n), linkType: 'posting', group: 'Engineering', countries: ['DE'], city: 'Berlin', locationRaw: 'Berlin', workMode: 'Hybrid', workModeRaw: 'Hybrid', fit: 4, reasoning: 'Core skills match', gaps: '', seniority: 'Senior', assessmentBasis: 'Posting reviewed', postedDate: '', observedAt: '2026-11-20T01:00:00Z', availability: 'Open'});
async function fixture(fn) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'run-state-'));
  const root = path.join(directory, 'data');
  await mkdir(path.join(root, 'incoming'), {recursive: true}); await mkdir(path.join(directory, 'profile'));
  await writeFile(path.join(directory, 'profile', 'candidate_profile.md'), 'Approved example profile');
  await writeFile(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: []}));
  try { await fn(root); } finally { await rm(directory, {recursive: true, force: true}); }
}
const runFolder = (root, runId) => path.join(root, 'reports', 'runs', runId);
// Capture and assess numbered candidates; candidate 0 has no URL or provider id (alert title only).
async function assessed(root, runId, numbers) {
  const directory = runFolder(root, runId);
  await initializeLedger(directory);
  await changeLedger(directory, 'capture', {candidates: numbers.map(n => n === 0
    ? {company: 'Example', title: 'Engineer 0', location: 'Berlin', source: {label: 'Example', ref: 'alert:0'}}
    : {company: 'Example', title: `Engineer ${n}`, location: 'Berlin', url: job(n).url, provider: 'ATS', providerJobId: String(n), source: {label: 'Example', ref: `page1:${n}`}})});
  const {rows} = await readLedger(directory), profile = await profileRevision(root);
  await changeLedger(directory, 'resolve', {updates: rows.map(row => ({id: row.id, state: 'assessed', assessment: {fit: 4, basis: 'Posting reviewed', reasoning: 'Core skills match', gaps: '', evidence: 'Java and SQL; Berlin hybrid', profileRevision: profile}}))});
}
// Plain importer, exactly as the routine runs it.
async function importJobs(root, runId, jobs) {
  const filename = `2026-11-20-${runId}.json`;
  const payload = {schemaVersion: 1, runId, searchedAt: '2026-11-20T01:00:00Z', jobs: jobs.map(j => ({...j, sources: [{label: 'Example', url: j.url, file: filename}]}))};
  await writeFile(path.join(root, 'incoming', filename), JSON.stringify(payload));
  return importBatch({root, batchPath: path.join('incoming', filename)});
}
const pending = async (root, runId, current = null) => (await outstanding(root, current)).runs.find(run => run.runId === runId);
let passed = 0;
async function test(label, fn) { await fixture(fn); console.log(`ok ${++passed} ${label}`); }

await test('minimal init, batch task updates and fresh-process next with cursor', async root => {
  await initializeRun(root, 'run-aaaa', {tasks: [{id: 'employer:Example', kind: 'employer', source: 'Example', status: 'pending'}]});
  await assessed(root, 'setup-capture', [1, 2]);
  await updateTasks(root, 'run-aaaa', {tasks: [
    {id: 'employer:Example', kind: 'employer', source: 'Example', status: 'partial', cursor: 'page=2', reason: 'Page limit', nextAction: 'Read page 2 with overlap'},
    {id: 'portal:Board', kind: 'portal', source: 'Board', status: 'done', evidence: 'source-evidence.jsonl line 1'}]});
  const result = JSON.parse(execFileSync(process.execPath, [cli, 'next', '--root', root, '--run', 'run-aaaa'], {encoding: 'utf8'}));
  assert.equal(result.runs.find(run => run.runId === 'setup-capture').candidates.length, 2);
  const tasks = result.runs.find(run => run.runId === 'run-aaaa').tasks;
  assert.equal(tasks.length, 1); assert.equal(tasks[0].cursor, 'page=2');
  await assert.rejects(updateTasks(root, 'run-aaaa', {id: 'x', kind: 'employer', source: 'X', status: 'done'}), /evidence/);
  await assert.rejects(updateTasks(root, 'run-aaaa', {id: 'x', kind: 'employers', source: 'X', status: 'pending'}), /kind must be one of/);
  await assert.rejects(updateTasks(root, 'run-aaaa', {id: 'x', kind: 'employer', source: 'X', status: 'partial', reason: 'Limit'}), /nextAction/);
  await assert.rejects(initializeRun(root, 'run-aaaa'), /already has a manifest/);
});

await test('delivery is read from inventory; rejected and ambiguous stay pending', async root => {
  await initializeRun(root, 'run-aaaa');
  await assessed(root, 'run-aaaa', [0, 1, 2, 3]);
  await commit(root, data => { data.jobs.push({id: 'other', company: 'Other employer', title: 'Other job', status: 'New', provider: 'ATS', providerJobId: '3', url: 'https://other.test/3', notes: ''}); });
  const {provider, providerJobId, ...titleOnly} = job(0);
  const result = await importJobs(root, 'run-aaaa', [titleOnly, job(1), {...job(2), countries: ['ZZ']}, job(3)]);
  assert.equal(result.exitCode, 5); assert.equal(result.added, 2); assert.equal(result.ambiguous, 1);
  const left = (await pending(root, 'run-aaaa')).candidates.map(row => row.title).sort();
  assert.deepEqual(left, ['Engineer 2', 'Engineer 3'], 'URL-less candidate 0 matched by name; rejected 2 and ambiguous 3 remain');
  const summary = await summarizeRun(root, 'run-aaaa');
  assert.equal(summary.inventory.addedThisRun.length, 2);
  assert.equal(summary.importReports[0].unresolved.length, 2);
});

await test('interrupted or repeated import still counts additions once', async root => {
  await initializeRun(root, 'run-aaaa');
  await assessed(root, 'run-aaaa', [1, 2]);
  await importJobs(root, 'run-aaaa', [job(1), job(2)]);
  const retry = await importJobs(root, 'run-aaaa', [job(1), job(2)]);
  assert.equal(retry.added, 0); assert.equal(retry.unchanged, 2, 'Report now describes the retry only');
  const summary = await summarizeRun(root, 'run-aaaa');
  assert.equal(summary.inventory.addedThisRun.length, 2);
  assert.equal(summary.importReports.at(-1).unchanged, 2);
  assert.equal(await pending(root, 'run-aaaa'), undefined);
});

await test('cross-run: setup captures delivered later; refresh is touched, not added', async root => {
  await assessed(root, 'setup-capture', [1]);
  await initializeRun(root, 'run-bbbb');
  await importJobs(root, 'run-bbbb', [job(1)]);
  assert.equal(await pending(root, 'setup-capture'), undefined);
  const first = await summarizeRun(root, 'run-bbbb');
  assert.equal(first.candidates.total, 0); assert.equal(first.inventory.addedThisRun.length, 1);
  await initializeRun(root, 'run-cccc');
  await importJobs(root, 'run-cccc', [{...job(1), reasoning: 'Refreshed requirements'}]);
  const refresh = await summarizeRun(root, 'run-cccc');
  assert.equal(refresh.inventory.addedThisRun.length, 0); assert.equal(refresh.inventory.touchedThisRun, 1);
});

await test('profile change, scope exclusions and legacy manifests are reported, not blocked', async root => {
  await initializeRun(root, 'run-aaaa', {scope: {sources: ['*'], exclusions: [{source: 'Example', reason: 'User excluded today'}]}});
  await assessed(root, 'run-aaaa', [1]);
  await writeFile(path.resolve(root, '../profile/candidate_profile.md'), 'Changed profile');
  const next = await outstanding(root, 'run-aaaa');
  assert.equal(next.profileChanged, true);
  const row = next.runs.find(run => run.runId === 'run-aaaa').candidates[0];
  assert.equal(row.needsReassessment, true); assert.equal(row.excludedNow, true);
  const legacy = runFolder(root, 'legacy-old'); await mkdir(legacy);
  await writeFile(path.join(legacy, 'run-completion.json'), '{"schemaVersion":1}');
  assert.ok((await outstanding(root)).warnings.some(warning => warning.runId === 'legacy-old'));
  assert.equal(await readFile(path.join(legacy, 'run-completion.json'), 'utf8'), '{"schemaVersion":1}');
});

await test('summary is read-only and counts task statuses', async root => {
  await initializeRun(root, 'run-aaaa', {tasks: [{id: 'employer:A', kind: 'employer', source: 'A', status: 'partial', reason: 'Page limit', nextAction: 'Page 3'}]});
  const before = await readFile(path.join(runFolder(root, 'run-aaaa'), 'run-completion.json'), 'utf8');
  const summary = JSON.parse(execFileSync(process.execPath, [cli, 'summary', '--root', root, '--run', 'run-aaaa'], {encoding: 'utf8'}));
  assert.equal(summary.tasks.employer.partial, 1); assert.equal(summary.tasks.employer.done, 0);
  assert.equal(summary.unfinishedTasks.length, 1);
  assert.equal(await readFile(path.join(runFolder(root, 'run-aaaa'), 'run-completion.json'), 'utf8'), before);
  assert.equal((await readRun(root, 'run-aaaa')).schemaVersion, 2);
});
console.log(`${passed} run-state scenarios passed (temporary fixtures only).`);
