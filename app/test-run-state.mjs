import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initializeRun, captureFinds, resolveFinds, outstanding, summarizeRun} from './run-state.mjs';
import {readLedger} from './candidate-ledger.mjs';
import {importBatch} from './import-discoveries.mjs';
import {commit} from './store.mjs';

const cli = fileURLToPath(new URL('./run-state.mjs', import.meta.url));
const job = n => ({company: 'Example', title: `Engineer ${n}`, url: `https://example.test/jobs/${n}`, provider: 'ATS', providerJobId: String(n), linkType: 'posting', group: 'Engineering', countries: ['DE'], city: 'Berlin', locationRaw: 'Berlin', workMode: 'Hybrid', workModeRaw: 'Hybrid', fit: 4, reasoning: 'Core skills match', gaps: '', seniority: 'Senior', assessmentBasis: 'Posting reviewed', postedDate: '', observedAt: '2026-11-20T01:00:00Z', availability: 'Open'});
// Subagent result line: extra fields (requirements, mail id) are ignored by capture.
const line = (n, extra = {}) => JSON.stringify({company: 'Example', title: `Engineer ${n}`, location: 'Berlin', url: job(n).url, provider: 'ATS', providerJobId: String(n), requirements: ['Java'], ...extra});
let directory, root;
async function fixture(fn) {
  directory = await mkdtemp(path.join(os.tmpdir(), 'run-state-'));
  root = path.join(directory, 'data');
  await mkdir(path.join(root, 'incoming'), {recursive: true}); await mkdir(path.join(directory, 'profile'));
  await writeFile(path.join(directory, 'profile', 'candidate_profile.md'), 'Approved example profile');
  await writeFile(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: []}));
  try { await fn(); } finally { await rm(directory, {recursive: true, force: true}); }
}
async function capture(lines, name = 'employer-example.jsonl') {
  const file = path.join(directory, name);
  await writeFile(file, lines.join('\n'));
  return captureFinds(root, [file]);
}
const assess = (result, extra = {}) => resolveFinds(root, result.new.map(row => ({id: row.id, state: 'assessed', basis: 'Posting reviewed', fit: 4, reasoning: 'Core skills match', evidence: 'Java and SQL required', ...extra})));
async function importJobs(runId, jobs) {
  const filename = `2026-11-20-${runId}.json`;
  const payload = {schemaVersion: 1, runId, searchedAt: '2026-11-20T01:00:00Z', jobs: jobs.map(j => ({...j, sources: [{label: 'Example', url: j.url, file: filename}]}))};
  await writeFile(path.join(root, 'incoming', filename), JSON.stringify(payload));
  return importBatch({root, batchPath: path.join('incoming', filename)});
}
// The next scheduled run: the current one is moved to yesterday, so init starts a new run instead of continuing it.
async function nextDay() {
  const id = (await readFile(path.join(root, 'reports', 'runs', 'CURRENT'), 'utf8')).trim(), file = path.join(root, 'reports', 'runs', id, 'run-completion.json');
  const state = JSON.parse(await readFile(file, 'utf8'));
  await writeFile(file, JSON.stringify({...state, startedAt: new Date(Date.parse(state.startedAt) - 86400000).toISOString()}));
}
const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args, '--root', root], {encoding: 'utf8'}));
let passed = 0;
async function test(label, fn) { await fixture(fn); console.log(`ok ${++passed} ${label}`); }

await test('init names the run and batch; capture reads subagent JSONL; resolve takes short ids', async () => {
  const started = run('init');
  assert.match(started.runId, /^run-\d{12}-[0-9a-f]{4}$/);
  assert.match(started.batch, new RegExp(`^data/incoming/\\d{4}-\\d\\d-\\d\\d-${started.runId}\\.json$`));
  assert.equal((await readFile(path.join(root, 'reports', 'runs', 'CURRENT'), 'utf8')).trim(), started.runId);
  const file = path.join(directory, 'finds.jsonl');
  await writeFile(file, [line(1, {mailId: 'm1'}), line(2), JSON.stringify({company: 'Example', title: 'Engineer 3'})].join('\n'));
  const captured = run('capture', '--input', file);
  assert.equal(captured.captured, 3); assert.equal(captured.new.length, 3); assert.equal(captured.new[0].id.length, 8);
  const decisions = path.join(directory, 'decisions.json');
  await writeFile(decisions, JSON.stringify([{id: captured.new[0].id, state: 'assessed', basis: 'Posting reviewed', fit: 4, reasoning: 'Java match', evidence: 'Requires Java'},
    {id: captured.new[1].id, state: 'excluded', reason: 'Too junior'}]));
  assert.deepEqual(run('resolve', '--input', decisions).candidates, {total: 3, pending: 1, assessed: 1, excluded: 1, duplicate: 0});
  const {rows} = await readLedger(path.join(root, 'reports', 'runs', started.runId));
  assert.equal(rows[0].assessment.basis, 'Posting reviewed'); assert.match(rows[0].assessment.profileRevision, /^[a-f0-9]{64}$/);
  assert.equal(rows[2].discovery.location, 'Unknown'); assert.equal(rows[2].discovery.source.label, 'finds');
  await assert.rejects(resolveFinds(root, [{id: 'abc', state: 'excluded', reason: 'x'}]), /Unknown or ambiguous id/);
  await assert.rejects(resolveFinds(root, [{id: captured.new[2].id, state: 'done'}]), /State must be/);
  await assert.rejects(resolveFinds(root, [{id: captured.new[2].id, state: 'excluded'}]), /reason/);
  // Evidence is never upgraded by defaults.
  await assert.rejects(resolveFinds(root, [{id: captured.new[2].id, state: 'assessed', fit: 3, reasoning: 'Title fits'}]), /needs basis/);
  await assert.rejects(resolveFinds(root, [{id: captured.new[2].id, state: 'assessed', basis: 'Posting reviewed', fit: 3, reasoning: 'Title fits'}]), /needs evidence/);
  await resolveFinds(root, [{id: captured.new[2].id, state: 'assessed', basis: 'Title only', fit: 3, reasoning: 'Title fits'}]);
  const titleOnly = (await readLedger(path.join(root, 'reports', 'runs', started.runId))).rows[2].assessment;
  assert.deepEqual([titleOnly.basis, titleOnly.evidence], ['Title only', 'Title only']);
});

await test('finds already stored (any status) or dropped are marked duplicate at capture; name-only matches stay for the agent', async () => {
  await initializeRun(root);
  await commit(root, data => { data.jobs.push({id: 'r5', company: 'Example GmbH', title: 'Engineer 5', status: 'Applied', provider: 'ATS', providerJobId: '5', url: job(5).url, linkType: 'posting', city: 'Berlin', locationRaw: 'Berlin', notes: ''},
    {id: 'r8', company: 'Example', title: 'Engineer 8', status: 'Dismissed', provider: 'ATS', providerJobId: '8', url: job(8).url, linkType: 'posting', city: 'Berlin', locationRaw: 'Berlin', notes: ''},
    {id: 'other', company: 'Other employer', title: 'Other job', status: 'New', provider: 'ATS', providerJobId: '7', url: 'https://other.test/7', linkType: 'posting', notes: ''}); });
  await mkdir(path.join(root, 'reports'), {recursive: true});
  await writeFile(path.join(root, 'reports', 'coverage.json'), JSON.stringify({dropped: [{provider: 'ATS', providerJobId: '6', url: '', company: 'Example', title: 'Engineer 6', reason: 'Too junior', droppedAt: '2026-11-01'}]}));
  // 5: same provider id, other city; 6: dropped; 7: id shared with another employer; 8 under a new requisition id: name match only.
  const result = await capture([line(5, {location: 'Vienna'}), line(6), line(7), line(8, {providerJobId: '88', url: 'https://example.test/jobs/88'})]);
  assert.deepEqual(result.known.map(row => row.match), ['r5 (Applied)', 'dropped: Too junior']);
  assert.deepEqual(result.new.map(row => row.title), ['Engineer 7']);
  assert.deepEqual(result.similar.map(row => [row.title, row.match]), [['Engineer 8', 'r8 (Dismissed)']]);
  assert.equal((await summarizeRun(root)).candidates.duplicate, 2);
});

await test('delivery is read from inventory; rejected and ambiguous finds are carried to the next run', async () => {
  const first = await initializeRun(root);
  await commit(root, data => { data.jobs.push({id: 'other', company: 'Other employer', title: 'Other job', status: 'New', provider: 'ATS', providerJobId: '3', url: 'https://other.test/3', notes: ''}); });
  await assess(await capture([JSON.stringify({company: 'Example', title: 'Engineer 0', location: 'Berlin', source: 'Alert'}), line(1), line(2), line(3)]));
  const {provider, providerJobId, ...titleOnly} = job(0);
  const result = await importJobs(first.runId, [titleOnly, job(1), {...job(2), countries: ['ZZ']}, job(3)]);
  assert.equal(result.exitCode, 5); assert.equal(result.added, 2); assert.equal(result.ambiguous, 1);
  const summary = await summarizeRun(root);
  assert.equal(summary.addedThisRun.length, 2); assert.equal(summary.importReports[0].unresolved.length, 2);
  const second = await initializeRun(root);
  assert.deepEqual(second.carried.map(row => row.title).sort(), ['Engineer 2', 'Engineer 3'], 'URL-less 0 matched by name; rejected 2 and ambiguous 3 carried');
  assert.equal(second.carried[0].fit, 4);
});

await test('repeated import counts additions once; a refresh in a later run is touched, not added', async () => {
  const first = await initializeRun(root);
  await assess(await capture([line(1), line(2)]));
  await importJobs(first.runId, [job(1), job(2)]);
  const retry = await importJobs(first.runId, [job(1), job(2)]);
  assert.equal(retry.added, 0); assert.equal(retry.unchanged, 2);
  assert.equal((await summarizeRun(root)).addedThisRun.length, 2);
  const second = await initializeRun(root);
  assert.equal(second.carried.length, 0);
  await importJobs(second.runId, [{...job(1), reasoning: 'Refreshed requirements'}]);
  const refresh = await summarizeRun(root);
  assert.equal(refresh.addedThisRun.length, 0); assert.equal(refresh.touchedThisRun, 1);
});

await test('an interrupted run is resumed from files: carried work and earlier decisions are reused, not re-rated', async () => {
  await initializeRun(root);
  const found = await capture([line(1), line(2), line(3)]);
  await resolveFinds(root, [{id: found.new[0].id, state: 'assessed', basis: 'Posting reviewed', fit: 5, reasoning: 'Strong Java match', evidence: 'Java 17 essential'}, {id: found.new[1].id, state: 'excluded', reason: 'On-site in another country'}]);
  // Interrupted before import. The next day's run lists the leftovers and meets the same finds again.
  await nextDay();
  const resumed = await initializeRun(root);
  assert.deepEqual(resumed.carried.map(row => [row.title, row.state]), [['Engineer 1', 'assessed'], ['Engineer 3', 'pending']]);
  const again = await capture([line(1), line(2), line(3)]);
  assert.deepEqual(again.decidedBefore.map(row => [row.title, row.state, row.fit ?? row.reason]), [['Engineer 1', 'assessed', 5], ['Engineer 2', 'excluded', 'On-site in another country']]);
  assert.deepEqual(again.new.map(row => row.title), ['Engineer 3']);
  // Reused decisions are saved on today's rows and earlier rows point here, so a restart carries each vacancy once.
  assert.deepEqual((await summarizeRun(root)).candidates, {total: 3, pending: 1, assessed: 1, excluded: 1, duplicate: 0});
  const restart = await initializeRun(root);
  assert.deepEqual(restart.carried.map(row => [row.run, row.title, row.state]), [[resumed.runId, 'Engineer 1', 'assessed'], [resumed.runId, 'Engineer 3', 'pending']]);
});

await test('a new requisition with a stored title survives an interruption as similar, not delivered', async () => {
  await initializeRun(root);
  await commit(root, data => { data.jobs.push({id: 'r8', company: 'Example', title: 'Engineer 8', status: 'Applied', provider: 'ATS', providerJobId: '8', url: job(8).url, linkType: 'posting', city: 'Berlin', locationRaw: 'Berlin', notes: ''}); });
  const found = await capture([line(8, {providerJobId: '88', url: 'https://example.test/jobs/88'})]);
  assert.equal(found.similar.length, 1);
  await resolveFinds(root, [{id: found.similar[0].id, state: 'assessed', basis: 'Posting reviewed', fit: 4, reasoning: 'Second opening', evidence: 'Requisition 88, Java essential'}]);
  await nextDay();
  const next = await initializeRun(root);
  assert.deepEqual(next.carried.map(row => [row.title, row.state, row.similar]), [['Engineer 8', 'assessed', 'r8 (Applied)']]);
});

await test('an exclusion reused after rediscovery stays resolved across restarts', async () => {
  await initializeRun(root);
  const first = await capture([line(4)]);
  await resolveFinds(root, [{id: first.new[0].id, state: 'excluded', reason: 'Too junior'}]);
  await nextDay();
  await initializeRun(root);
  const again = await capture([line(4)]);
  assert.deepEqual(again.decidedBefore.map(row => [row.state, row.reason]), [['excluded', 'Too junior']]);
  assert.equal((await summarizeRun(root)).candidates.excluded, 1);
  assert.deepEqual((await initializeRun(root)).carried, []);
});

await test('profile change re-opens exclusions only; duplicates stay; summary changes only the manifest; bad ledgers are preserved', async () => {
  await initializeRun(root);
  await commit(root, data => { data.jobs.push({id: 'r5', company: 'Example', title: 'Engineer 5', status: 'Applied', provider: 'ATS', providerJobId: '5', url: job(5).url, linkType: 'posting', notes: ''}); });
  const found = await capture([line(4), line(5)]);
  await resolveFinds(root, [{id: found.new[0].id, state: 'excluded', reason: 'Too junior'}]);
  await writeFile(path.resolve(root, '../profile/candidate_profile.md'), 'Changed profile');
  await nextDay();
  const next = await initializeRun(root);
  assert.equal(next.profileChanged, false, 'New run starts on the new profile');
  assert.deepEqual(next.carried.map(row => [row.title, row.reassess]), [['Engineer 4', true]]);
  const broken = path.join(root, 'reports', 'runs', 'legacy-old'); await mkdir(broken);
  await writeFile(path.join(broken, 'run-ledger.jsonl'), '{"schemaVersion":0}\n');
  assert.ok((await outstanding(root)).warnings.some(warning => warning.run === 'legacy-old'));
  assert.equal(await readFile(path.join(broken, 'run-ledger.jsonl'), 'utf8'), '{"schemaVersion":0}\n');
  const folder = path.join(root, 'reports', 'runs', next.runId), before = await readFile(path.join(folder, 'run-ledger.jsonl'), 'utf8'), jobs = await readFile(path.join(root, 'jobs.json'), 'utf8');
  assert.equal(run('summary').runId, next.runId);
  assert.equal(await readFile(path.join(folder, 'run-ledger.jsonl'), 'utf8'), before); assert.equal(await readFile(path.join(root, 'jobs.json'), 'utf8'), jobs);
  assert.match(JSON.parse(await readFile(path.join(folder, 'run-completion.json'), 'utf8')).finishedAt, /^\d{4}-/);
  await assert.rejects(initializeRun(root, next.runId), /never overwrite/);
});
await test('a same-day restart continues the run and lists result files never captured; summary ends it', async () => {
  const first = run('init'), folder = path.join(root, 'reports', 'runs', first.runId);
  await writeFile(path.join(folder, 'employer-a.jsonl'), [line(1), line(2)].join('\n'));
  await writeFile(path.join(folder, 'postings-a.jsonl'), JSON.stringify({url: job(1).url, advertisedTitle: 'Engineer 1', company: 'Example', requirements: ['Java']}));
  const found = run('capture', '--input', path.join(folder, 'employer-a.jsonl'));
  await writeFile(path.join(folder, 'decisions-1.json'), JSON.stringify([{id: found.new[0].id, state: 'assessed', basis: 'Posting reviewed', fit: 4, reasoning: 'Java match', evidence: 'Requires Java'}]));
  run('resolve', '--input', path.join(folder, 'decisions-1.json'));
  // Killed after a subagent wrote its file, before capture.
  await writeFile(path.join(folder, 'employer-b.jsonl'), line(3));
  const again = run('init');
  assert.deepEqual([again.runId, again.resumed, again.batch], [first.runId, true, first.batch]);
  assert.deepEqual(again.carried.map(row => [row.run, row.title, row.state, row.fit ?? null]), [[first.runId, 'Engineer 1', 'assessed', 4], [first.runId, 'Engineer 2', 'pending', null]]);
  assert.deepEqual(again.uncaptured.map(file => path.basename(file)).sort(), ['employer-b.jsonl', 'postings-a.jsonl']);
  assert.equal(again.uncaptured[0].split('/').slice(0, 3).join('/'), 'data/reports/runs');
  run('capture', '--input', path.join(folder, 'employer-b.jsonl'));
  run('summary');
  const later = run('init');
  assert.notEqual(later.runId, first.runId); assert.equal(later.resumed, undefined);
  assert.deepEqual(later.uncaptured, [], 'A finished run lists no files');
  assert.deepEqual(later.carried.map(row => row.title), ['Engineer 1', 'Engineer 2', 'Engineer 3']);
  // Next day after an unannounced stop: a new run lists the old run's uncaptured file until a summary closes it.
  await writeFile(path.join(root, 'reports', 'runs', later.runId, 'employer-c.jsonl'), line(4));
  await nextDay();
  const nextRun = run('init');
  assert.notEqual(nextRun.runId, later.runId);
  assert.deepEqual(nextRun.uncaptured, [`data/reports/runs/${later.runId}/employer-c.jsonl`]);
  run('summary');
  assert.equal(JSON.parse(await readFile(path.join(root, 'reports', 'runs', later.runId, 'run-completion.json'), 'utf8')).closedBy, nextRun.runId);
  assert.deepEqual(run('init').uncaptured, []);
});
console.log(`${passed} run-state scenarios passed (temporary fixtures only).`);
