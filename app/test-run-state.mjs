import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm, unlink, rename, rmdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initializeRun, readRun, updateRun, prepareImport, executeImport, reconcileRun, outstanding, profileRevision, summarizeRun} from './run-state.mjs';
import {readLedger, changeLedger, initializeLedger} from './candidate-ledger.mjs';
import {commit} from './store.mjs';

const cli = fileURLToPath(new URL('./run-state.mjs', import.meta.url));
const scope = {sources: ['Example'], exclusions: []};
const task = {id: 'employer:Example', kind: 'employer', source: 'Example', status: 'pending', nextAction: 'Read page 1', reason: '', evidence: '', cursor: null, calls: 0, maxCalls: 15};
const job = n => ({company: 'Example', title: `Engineer ${n}`, url: `https://example.test/jobs/${n}`, provider: 'ATS', providerJobId: String(n), linkType: 'posting', group: 'Engineering', countries: ['DE'], city: 'Berlin', locationRaw: 'Berlin', workMode: 'Hybrid', workModeRaw: 'Hybrid', fit: 4, reasoning: 'Core skills match', gaps: '', seniority: 'Senior', assessmentBasis: 'Posting reviewed', postedDate: '', observedAt: '2026-11-20T01:00:00Z', availability: 'Open'});
async function fixture(fn) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'run-state-'));
  const root = path.join(directory, 'data');
  await mkdir(path.join(root, 'incoming'), {recursive: true}); await mkdir(path.join(directory, 'profile'));
  await writeFile(path.join(directory, 'profile', 'candidate_profile.md'), 'Approved example profile');
  await writeFile(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: []}));
  try { await fn(root); } finally { await rm(directory, {recursive: true, force: true}); }
}
async function init(root, runId = 'run-aaaa') { await initializeRun(root, runId, {scope, tasks: [structuredClone(task)]}); }
async function candidates(root, runId, numbers) {
  const directory = path.join(root, 'reports', 'runs', runId);
  await initializeLedger(directory);
  await changeLedger(directory, 'capture', {candidates: numbers.map(n => ({company: 'Example', title: `Engineer ${n}`, location: 'Berlin', url: job(n).url, provider: 'ATS', providerJobId: String(n), source: {label: 'Example', ref: `page1:${n}`}}))});
  const state = await readLedger(directory);
  const currentProfile = await profileRevision(root);
  await changeLedger(directory, 'resolve', {revision: state.revision, updates: state.rows.map(row => ({id: row.id, state: 'assessed', assessment: {fit: 4, basis: 'Posting reviewed', reasoning: 'Core skills match', gaps: '', evidence: 'Java and SQL required; Berlin hybrid', profileRevision: currentProfile}}))});
  return state.rows.map(row => ({runId, id: row.id}));
}
async function prepare(root, runId, refs, jobs, suffix = '') {
  const filename = `2026-11-20-${runId}${suffix}.json`;
  const payload = {schemaVersion: 1, runId, searchedAt: '2026-11-20T01:00:00Z', jobs: jobs.map(j => ({...j, sources: [{label: 'Example', url: j.url, file: filename}]}))};
  await writeFile(path.join(root, 'incoming', filename), '\uFEFF' + JSON.stringify(payload));
  return prepareImport(root, runId, {revision: (await readRun(root, runId)).revision, batch: filename, mapping: refs});
}
let passed = 0;
async function test(label, fn) {
  await fixture(fn);
  console.log(`ok ${++passed} ${label}`);
}

await test('fresh-process queue finds setup candidates and unfinished source cursor', async root => {
  await init(root);
  await candidates(root, 'setup-capture', [1, 2]);
  const {revision} = await readRun(root, 'run-aaaa');
  await updateRun(root, 'run-aaaa', 'task', {revision, task: {...task, status: 'partial', calls: 6, cursor: 'page=2', reason: 'Source limit', nextAction: 'Read page 2 with overlap'}});
  const result = JSON.parse(execFileSync(process.execPath, [cli, 'next', '--root', root, '--run', 'run-aaaa'], {encoding: 'utf8'}));
  assert.equal(result.runs.find(run => run.runId === 'setup-capture').candidates.length, 2);
  assert.equal(result.runs.find(run => run.runId === 'run-aaaa').tasks[0].cursor, 'page=2');
  await assert.rejects(updateRun(root, 'run-aaaa', 'task', {revision, task}), /revision changed/);
  await assert.rejects(updateRun(root, 'run-aaaa', 'task', {revision: (await readRun(root, 'run-aaaa')).revision, task: {...task, status: 'done'}}), /evidence/);
});

await test('scope expiry, stop, resume, profile drift and exhausted budgets block work', async root => {
  await init(root);
  const update = async (command, input) => updateRun(root, 'run-aaaa', command, {revision: (await readRun(root, 'run-aaaa')).revision, ...input});
  await update('stop', {reason: 'User stopped this run'});
  await assert.rejects(update('task', {task: {...task, status: 'active'}}), /blocked/);
  await update('context', {scope, reason: 'Same current scope'});
  assert.match((await outstanding(root, 'run-aaaa')).blockers[0], /stopped/);
  await update('resume', {scope, reason: 'User resumed this run'});
  await update('task', {task: {...task, calls: 15, status: 'partial', reason: '15-call limit'}});
  await assert.rejects(update('task', {task: {...task, calls: 15, status: 'active'}}), /limit reached/);
  await assert.rejects(update('task', {task}), /cannot decrease/);
  await update('context', {scope: {sources: ['Example'], exclusions: [{source: 'Example', reason: 'Session exclusion', expiresAt: '2020-01-01T00:00:00Z'}]}, reason: 'Test expired scope'});
  assert.ok((await outstanding(root, 'run-aaaa')).blockers.some(reason => reason.includes('expired')));
  await update('context', {scope, deadline: '2020-01-01T00:00:00Z', reason: 'Test deadline'});
  assert.ok((await outstanding(root, 'run-aaaa')).blockers.includes('deadline reached'));
  await update('context', {scope, reason: 'Scope review does not cancel deadline'});
  assert.ok((await outstanding(root, 'run-aaaa')).blockers.includes('deadline reached'));
  await update('context', {scope, deadline: null, reason: 'New authorized deadline context'});
  const refs = await candidates(root, 'run-aaaa', [1]);
  await writeFile(path.resolve(root, '../profile/candidate_profile.md'), 'Changed profile');
  assert.ok((await outstanding(root, 'run-aaaa')).blockers.some(reason => reason.includes('profile changed')));
  await update('context', {scope, reason: 'Accept changed profile'});
  await assert.rejects(prepare(root, 'run-aaaa', refs, [job(1)]), /current profile/);
});

await test('prepared batch and complete receipts survive original batch edits and repeated import', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await writeFile(path.join(root, 'incoming', '2026-11-20-run-aaaa.json'), '{}');
  const first = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(first.result.added, 1);
  const second = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(second.alreadyConfirmed, true); assert.equal(second.result.added, 1);
  assert.equal((await readRun(root, 'run-aaaa')).state.imports[0].attempts.length, 1);
  assert.equal((await outstanding(root, 'run-aaaa')).runs.find(run => run.runId === 'run-aaaa').candidates.length, 0);
});

await test('interruption after intent leaves unknown; explicit retry preserves uncertainty', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId}, {afterIntent: () => { throw Error('interrupted'); }}), /interrupted/);
  assert.equal((await reconcileRun(root, 'run-aaaa')).unresolvedAttempts.length, 1);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId, retryReason: 'Retry after inspection'}), /Unknown prior outcome/);
  const retry = await executeImport(root, 'run-aaaa', {importId, retryReason: 'No report; inspect saved batch and retry idempotently', allowUnknown: true});
  assert.equal(retry.result.added, 1);
  await reconcileRun(root, 'run-aaaa');
  assert.equal((await readRun(root, 'run-aaaa')).state.imports[0].attempts[0].receipt, null);
  const summary = await summarizeRun(root, 'run-aaaa');
  assert.equal(summary.imports.originalCounts, null);
  assert.equal(summary.imports.unknownAttempts.length, 1);
  assert.equal(summary.imports.confirmedUniqueCandidates.added, 1);
});

await test('interruption after commit/report recovers full receipt without importing again', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId}, {afterImport: () => { throw Error('after commit'); }}), /after commit/);
  assert.equal((await reconcileRun(root, 'run-aaaa')).unresolvedAttempts.length, 0);
  const next = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(next.alreadyConfirmed, true); assert.equal(next.result.added, 1);
  assert.equal(JSON.parse(await readFile(path.join(root, 'jobs.json'))).jobs.length, 1);
});

await test('missing report after commit is not treated as failure or zero additions', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId}, {afterImport: async result => { await unlink(path.join(root, result.report)); throw Error('lost receipt'); }}), /lost receipt/);
  assert.equal((await reconcileRun(root, 'run-aaaa')).unresolvedAttempts.length, 1);
  const retry = await executeImport(root, 'run-aaaa', {importId, retryReason: 'Reviewed snapshot; idempotent retry despite missing original receipt', allowUnknown: true});
  assert.equal(retry.result.unchanged, 1);
  const summary = await summarizeRun(root, 'run-aaaa');
  assert.equal(summary.imports.originalCountsKnown, false);
  assert.equal(summary.imports.originalCounts, null);
  assert.equal(summary.imports.confirmedUniqueCandidates.unchanged, 1);
  const pending = await outstanding(root, 'run-aaaa');
  assert.equal(pending.runs.find(run => run.runId === 'run-aaaa').imports[0].unknownOriginalOutcomes, true);
  assert.equal(JSON.parse(await readFile(path.join(root, 'jobs.json'))).jobs.length, 1);
});

await test('partial import keeps rejected candidates pending delivery and refuses blind retry', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1, 2]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1), {...job(2), countries: ['ZZ']}]);
  const result = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(result.result.exitCode, 5); assert.equal(result.result.added, 1);
  assert.deepEqual((await summarizeRun(root, 'run-aaaa')).imports.confirmedUniqueCandidates,
    {added: 1, updated: 0, unchanged: 0, ambiguous: 0, rejected: 1});
  const queue = (await outstanding(root, 'run-aaaa')).runs.find(run => run.runId === 'run-aaaa');
  assert.equal(queue.candidates.length, 1); assert.equal(queue.candidates[0].id, refs[1].id);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId, retryReason: 'Try again'}), /Repair ambiguous\/rejected/);
  const repaired = await prepare(root, 'run-aaaa', refs, [job(1), job(2)]);
  const retried = await executeImport(root, 'run-aaaa', {importId: repaired.importId});
  assert.equal(retried.result.added, 1); assert.equal(retried.result.unchanged, 1);
  assert.deepEqual((await summarizeRun(root, 'run-aaaa')).imports.confirmedUniqueCandidates,
    {added: 2, updated: 0, unchanged: 0, ambiguous: 0, rejected: 0});
  assert.equal(JSON.parse(await readFile(path.join(root, 'jobs.json'))).jobs.length, 2);
  assert.equal((await outstanding(root, 'run-aaaa')).runs.find(run => run.runId === 'run-aaaa').imports.length, 0, 'Confirmed repair settles older rejected delivery mappings');
});

await test('ambiguous receipts remain unresolved and require repair, never blind retry', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  await commit(root, data => { data.jobs.push({id: 'existing-other-employer', company: 'Other employer', title: 'Other job', status: 'New', provider: 'ATS', providerJobId: '1', url: 'https://other.test/1', notes: ''}); });
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  const result = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(result.result.ambiguous, 1);
  assert.equal((await summarizeRun(root, 'run-aaaa')).imports.confirmedUniqueCandidates.ambiguous, 1);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId, retryReason: 'Blind retry'}), /Repair ambiguous\/rejected/);
  assert.equal((await outstanding(root, 'run-aaaa')).runs.find(run => run.runId === 'run-aaaa').candidates.length, 1);
});

await test('unrelated reports, active locks, excluded scope and archive recovery', async root => {
  await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await assert.rejects(executeImport(root, 'run-aaaa', {importId}, {afterIntent: () => { throw Error('interrupted'); }}));
  const report = path.join(root, 'reports', '2026-11-20-run-aaaa.report.json');
  await writeFile(report, JSON.stringify({sha256: 'unrelated', importedAt: new Date().toISOString()}));
  assert.equal((await reconcileRun(root, 'run-aaaa')).unresolvedAttempts.length, 1);
  const directory = path.join(root, 'reports', 'runs', 'run-aaaa');
  await mkdir(path.join(directory, 'run-state.lock'));
  await assert.rejects(reconcileRun(root, 'run-aaaa'), /locked/);
  await rmdir(path.join(directory, 'run-state.lock'));
  await updateRun(root, 'run-aaaa', 'context', {revision: (await readRun(root, 'run-aaaa')).revision, scope: {sources: ['Other employer'], exclusions: []}, reason: 'User restricted this session'});
  await assert.rejects(executeImport(root, 'run-aaaa', {importId, retryReason: 'Attempt excluded source', allowUnknown: true}), /out of scope/);
  await updateRun(root, 'run-aaaa', 'context', {revision: (await readRun(root, 'run-aaaa')).revision, scope, reason: 'User restored Example'});
  await executeImport(root, 'run-aaaa', {importId, retryReason: 'Inspected missing original receipt', allowUnknown: true});
  await mkdir(path.join(root, 'incoming', 'imported'));
  await rename(path.join(root, 'incoming', '2026-11-20-run-aaaa.json'), path.join(root, 'incoming', 'imported', '2026-11-20-run-aaaa.json'));
  const result = await executeImport(root, 'run-aaaa', {importId});
  assert.equal(result.alreadyConfirmed, true);
  assert.equal(JSON.parse(await readFile(path.join(root, 'jobs.json'))).jobs.length, 1);
});

await test('cross-run delivery, user fields, old/legacy state and retained evidence', async root => {
  await init(root); const refs = await candidates(root, 'setup-capture', [1]);
  const {importId} = await prepare(root, 'run-aaaa', refs, [job(1)]);
  await executeImport(root, 'run-aaaa', {importId});
  await commit(root, data => { data.jobs[0].status = 'Shortlisted'; data.jobs[0].notes = 'Keep'; data.jobs[0].urgent = true; });
  await init(root, 'run-bbbb');
  const refresh = await prepare(root, 'run-bbbb', refs, [{...job(1), reasoning: 'Refreshed requirements'}]);
  await executeImport(root, 'run-bbbb', {importId: refresh.importId});
  const saved = JSON.parse(await readFile(path.join(root, 'jobs.json'))).jobs[0];
  const summary = await summarizeRun(root, 'run-bbbb');
  assert.equal(summary.candidates.total, 0);
  assert.equal(summary.imports.confirmedUniqueCandidates.updated, 1);
  assert.equal(saved.status, 'Shortlisted'); assert.equal(saved.notes, 'Keep'); assert.equal(saved.urgent, true);
  const legacy = path.join(root, 'reports', 'runs', 'legacy-old'); await mkdir(legacy);
  await writeFile(path.join(legacy, 'run-completion.json'), '{"old":true}');
  const oldCapture = path.join(root, 'reports', 'runs', 'old-pending'); await initializeLedger(oldCapture);
  await changeLedger(oldCapture, 'capture', {candidates: [{company: 'Old', title: 'Unfinished', location: 'Unknown', source: {label: 'Example', ref: 'old'}}]});
  const file = path.join(oldCapture, 'run-ledger.jsonl');
  const row = JSON.parse(await readFile(file, 'utf8')); row.discoveredAt = '2020-01-01T00:00:00Z'; await writeFile(file, JSON.stringify(row) + '\n');
  const queue = await outstanding(root, 'run-bbbb');
  assert.ok(queue.warnings.some(warning => warning.runId === 'legacy-old'));
  assert.equal(queue.runs.find(run => run.runId === 'old-pending').retention, 'preserve');
  assert.equal(await readFile(path.join(legacy, 'run-completion.json'), 'utf8'), '{"old":true}');
  assert.equal(queue.runs.some(run => run.runId === 'setup-capture'), false, 'Resolved setup captures do not clutter pending work');
});


await test('summary counts unique deliveries and exposes pending tasks', async root => {
 await init(root); const refs = await candidates(root, 'run-aaaa', [1,2]);
 const prepared = await prepare(root, 'run-aaaa', refs, [job(1),job(2)]);
 await executeImport(root, 'run-aaaa', {importId: prepared.importId});
 await executeImport(root, 'run-aaaa', {importId: prepared.importId});
 const summary = await summarizeRun(root, 'run-aaaa');
 assert.equal(summary.candidates.total, 2);
 assert.equal(summary.imports.confirmedUniqueCandidates.added, 2);
 assert.equal(summary.unfinishedTasks.length, 1);
 assert.equal(summary.imports.originalCountsKnown, true);
});

await test('summary exposes unattempted snapshots, stale assessments and partial sources without writes', async root => {
 await init(root); const refs = await candidates(root, 'run-aaaa', [1]);
 const prepared = await prepare(root, 'run-aaaa', refs, [job(1)]);
 assert.deepEqual((await summarizeRun(root, 'run-aaaa')).imports.unattempted, [prepared.importId]);
 await executeImport(root, 'run-aaaa', {importId: prepared.importId});
 await updateRun(root, 'run-aaaa', 'task', {revision: (await readRun(root, 'run-aaaa')).revision,
   task: {...task, status: 'partial', reason: 'Page limit', calls: 15}});
 await writeFile(path.resolve(root, '../profile/candidate_profile.md'), 'Changed approved profile');
 const before = await readRun(root, 'run-aaaa');
 const summary = JSON.parse(execFileSync(process.execPath, [cli, 'summary', '--root', root, '--run', 'run-aaaa'], {encoding: 'utf8'}));
 assert.equal(summary.tasks.employer.partial, 1);
 assert.equal(summary.tasks.employer.done, 0);
 assert.equal(summary.outstanding.runs.find(run => run.runId === 'run-aaaa').candidates[0].needsReassessment, true);
 assert.equal((await readRun(root, 'run-aaaa')).revision, before.revision);
});
console.log(`${passed} recovery/reporting scenarios passed (temporary fixtures only).`);
