// Persistent search recovery. Inventory writes are delegated to the existing importer.
import {readFile, writeFile, mkdir, readdir, lstat, realpath, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';
import {writeJsonAtomic} from './store.mjs';
import {readLedger, initializeLedger} from './candidate-ledger.mjs';
import {importBatch} from './import-discoveries.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const success = new Set(['added', 'updated', 'unchanged']);
const terminal = new Set(['done', 'not_due', 'excluded']);
const kinds = ['alerts', 'posting', 'refresh', 'employer', 'portal', 'gap', 'recheck', 'import', 'coverage', 'summary'];
const statuses = ['pending', 'active', 'done', 'partial', 'deferred', 'failed', 'not_due', 'excluded'];
function check(test, message) { if (!test) throw Error(message); }
function text(value) { return typeof value === 'string' && value.trim().length > 0 && value.length <= 4000; }
function name(value) { check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(value), 'Invalid run or file identifier'); return value; }
function timestamp(value) { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value)); }
function fields(value, allowed) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  check(Object.keys(value).every(key => allowed.includes(key)), 'Unknown fields');
}
function scopeValid(scope) {
  fields(scope, ['sources', 'exclusions']);
  check(Array.isArray(scope.sources) && scope.sources.length > 0 && scope.sources.every(text), 'Scope needs allowed source labels (or *)');
  check(Array.isArray(scope.exclusions), 'Scope needs exclusions array');
  for (const item of scope.exclusions) {
    fields(item, ['source', 'reason', 'expiresAt']);
    check(text(item.source) && text(item.reason) && (item.expiresAt === null || timestamp(item.expiresAt)), 'Invalid scope exclusion');
  }
}
function taskValid(task) {
  fields(task, ['id', 'kind', 'source', 'status', 'nextAction', 'reason', 'evidence', 'cursor', 'calls', 'maxCalls']);
  check(text(task.id) && kinds.includes(task.kind) && text(task.source) && statuses.includes(task.status), 'Invalid task');
  check(typeof task.nextAction === 'string' && typeof task.reason === 'string' && typeof task.evidence === 'string', 'Task text missing');
  check(task.cursor === null || text(task.cursor), 'Invalid continuation cursor');
  check(Number.isInteger(task.calls) && task.calls >= 0 && (task.maxCalls === null || Number.isInteger(task.maxCalls) && task.maxCalls >= 0), 'Invalid call budget');
  if (task.status === 'done') check(text(task.evidence), 'Done needs source/result evidence');
  if (['partial', 'deferred', 'failed', 'not_due', 'excluded'].includes(task.status)) check(text(task.reason), 'Task outcome needs a reason');
  if (['pending', 'active', 'partial', 'deferred', 'failed'].includes(task.status)) check(text(task.nextAction), 'Unfinished task needs nextAction');
}
function stateValid(state) {
  fields(state, ['schemaVersion', 'runId', 'startedAt', 'updatedAt', 'profileRevision', 'scope', 'deadline', 'stopReason', 'contextReason', 'tasks', 'imports']);
  check(state.schemaVersion === 1, 'Unsupported run state; preserve legacy completion file'); name(state.runId);
  check(timestamp(state.startedAt) && timestamp(state.updatedAt) && /^[a-f0-9]{64}$/.test(state.profileRevision), 'Invalid run metadata');
  scopeValid(state.scope);
  check(state.deadline === null || timestamp(state.deadline), 'Invalid deadline');
  check(typeof state.stopReason === 'string' && typeof state.contextReason === 'string', 'Invalid context');
  check(Array.isArray(state.tasks) && Array.isArray(state.imports), 'Missing work arrays');
  const ids = new Set();
  for (const task of state.tasks) { taskValid(task); check(!ids.has(task.id), 'Duplicate task id'); ids.add(task.id); }
  const imports = new Set();
  for (const item of state.imports) {
    check(text(item.id) && !imports.has(item.id), 'Invalid import id'); imports.add(item.id);
    name(item.filename);
    check(typeof item.raw === 'string' && digest(item.raw) === item.sha256, 'Import snapshot hash mismatch');
    const batch = JSON.parse(item.raw);
    check(Array.isArray(batch.jobs) && Array.isArray(item.mapping) && item.mapping.length === batch.jobs.length, 'Import mapping length mismatch');
    for (const ref of item.mapping) { name(ref.runId); check(/^[a-f0-9]{64}$/.test(ref.id) && /^[a-f0-9]{64}$/.test(ref.fingerprint) && text(ref.source), 'Invalid candidate reference'); }
    check(Array.isArray(item.attempts), 'Missing attempts');
    for (const attempt of item.attempts) {
      name(attempt.id); check(timestamp(attempt.startedAt), 'Invalid attempt time');
      check(attempt.receipt === null || typeof attempt.receipt === 'object', 'Invalid receipt');
    }
  }
}
async function optionalRead(file) { try { return await readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
export async function profileRevision(root) { return digest(await readFile(path.resolve(root, '../profile/candidate_profile.md'))); }
async function runsDirectory(root) {
  const actualRoot = await realpath(root);
  const directory = path.join(actualRoot, 'reports', 'runs');
  await mkdir(directory, {recursive: true});
  check(await realpath(directory) === directory, 'Runs directory must not be redirected by symlinks');
  return directory;
}
async function runDirectory(root, runId, create = false) {
  const directory = path.join(await runsDirectory(root), name(runId));
  if (create) await mkdir(directory, {recursive: true});
  check(!(await lstat(directory)).isSymbolicLink(), 'Run directory must not be a symlink');
  return directory;
}
async function locked(root, runId, fn) {
  const directory = await runDirectory(root, runId), lock = path.join(directory, 'run-state.lock');
  try { await mkdir(lock); } catch (error) { if (error.code === 'EEXIST') throw Error('Run state locked; never remove a lock while its writer may be active'); throw error; }
  try { return await fn(directory); } finally { await rmdir(lock); }
}
export async function readRun(root, runId) {
  const directory = await runDirectory(root, runId);
  const raw = await readFile(path.join(directory, 'run-completion.json'), 'utf8');
  const state = JSON.parse(raw.replace(/^\uFEFF/, '')); stateValid(state);
  check(state.runId === runId, 'Run folder does not match manifest');
  return {state, revision: digest(raw)};
}
async function save(directory, state) {
  state.updatedAt = now(); stateValid(state);
  await writeJsonAtomic(path.join(directory, 'run-completion.json'), state);
}
function fingerprint(row) { return digest(JSON.stringify({id: row.id, state: row.state, assessment: row.assessment, reason: row.reason, profileRevision: row.profileRevision})); }
function blockers(state, revision) {
  const reasons = [];
  if (state.stopReason) reasons.push(`stopped: ${state.stopReason}`);
  if (state.deadline && Date.parse(state.deadline) <= Date.now()) reasons.push('deadline reached');
  if (state.profileRevision !== revision) reasons.push('profile changed; review context and assessments');
  if (state.scope.exclusions.some(item => item.expiresAt && Date.parse(item.expiresAt) <= Date.now())) reasons.push('temporary exclusion expired; review scope explicitly');
  return reasons;
}
function sourceAllowed(state, source) {
  return (state.scope.sources.includes('*') || state.scope.sources.includes(source)) && !state.scope.exclusions.some(item => item.source === source);
}
export async function initializeRun(root, runId, input) {
  fields(input, ['scope', 'deadline', 'tasks']); scopeValid(input.scope);
  const directory = await runDirectory(root, runId, true);
  return locked(root, runId, async () => {
    check(await optionalRead(path.join(directory, 'run-completion.json')) === null, 'Run already has completion state; use read/context, never overwrite it');
    const state = {schemaVersion: 1, runId, startedAt: now(), updatedAt: now(), profileRevision: await profileRevision(root), scope: input.scope, deadline: input.deadline ?? null, stopReason: '', contextReason: '', tasks: input.tasks, imports: []};
    stateValid(state); await initializeLedger(directory); await save(directory, state);
    return {runId, profileRevision: state.profileRevision};
  });
}
export async function updateRun(root, runId, command, input) {
  return locked(root, runId, async directory => {
    const {state, revision} = await readRun(root, runId);
    check(input.revision === revision, 'Run revision changed; read before updating');
    if (command === 'task') {
      fields(input, ['revision', 'task']); taskValid(input.task);
      const previous = state.tasks.find(task => task.id === input.task.id);
      if (previous) {
        check(input.task.calls >= previous.calls, 'Call usage cannot decrease');
        check(input.task.source === previous.source && input.task.kind === previous.kind && input.task.maxCalls === previous.maxCalls, 'Task identity/budget is fixed; new run required');
      }
      if (input.task.status === 'active') {
        check(blockers(state, await profileRevision(root)).length === 0, 'Run blocked; inspect next');
        check(sourceAllowed(state, input.task.source), 'Task source excluded');
        check(input.task.maxCalls === null || input.task.calls < input.task.maxCalls, 'Task call limit reached');
      }
      if (previous) Object.assign(previous, input.task); else state.tasks.push(input.task);
    } else if (command === 'stop') {
      fields(input, ['revision', 'reason']); check(text(input.reason), 'Stop needs reason'); state.stopReason = input.reason;
    } else if (command === 'context' || command === 'resume') {
      fields(input, ['revision', 'scope', 'deadline', 'reason']); scopeValid(input.scope);
      check(text(input.reason), 'Context change needs reason/current authorization');
      state.scope = input.scope;
      if (Object.hasOwn(input, 'deadline')) state.deadline = input.deadline;
      state.profileRevision = await profileRevision(root); state.contextReason = input.reason;
      if (command === 'resume') state.stopReason = '';
    } else throw Error('Unknown update command');
    await save(directory, state); return {runId, updatedAt: state.updatedAt};
  });
}

// Register the complete immutable batch and candidate mapping BEFORE any inventory write.
export async function prepareImport(root, runId, input) {
  fields(input, ['revision', 'batch', 'mapping']); name(input.batch);
  return locked(root, runId, async directory => {
    const {state, revision} = await readRun(root, runId);
    check(input.revision === revision, 'Run revision changed');
    check(blockers(state, await profileRevision(root)).length === 0, 'Run blocked; inspect next');
    const raw = (await readFile(path.join(root, 'incoming', input.batch), 'utf8')).replace(/^\uFEFF/, '');
    const batch = JSON.parse(raw.replace(/^\uFEFF/, ''));
    check(Array.isArray(batch.jobs) && Array.isArray(input.mapping) && batch.jobs.length === input.mapping.length, 'Map every batch index, in order');
    check(batch.runId === runId, 'New recovery batches must use the owning runId');
    const mapping = [], seen = new Set();
    for (const ref of input.mapping) {
      fields(ref, ['runId', 'id']); name(ref.runId);
      const {rows} = await readLedger(await runDirectory(root, ref.runId));
      const row = rows.find(candidate => candidate.id === ref.id);
      check(row?.state === 'assessed' && row.assessment.profileRevision === state.profileRevision, 'Candidate needs assessment against the current profile');
      check(sourceAllowed(state, row.discovery.source.label), 'Candidate source outside current scope');
      const key = `${ref.runId}/${ref.id}`; check(!seen.has(key), 'Candidate mapped twice'); seen.add(key);
      const job = batch.jobs[mapping.length];
      check(job.company === row.discovery.company && job.title === row.discovery.title && job.fit === row.assessment.fit && job.assessmentBasis === row.assessment.basis, 'Batch must match captured candidate/assessment');
      if (row.discovery.provider) check(job.provider === row.discovery.provider && job.providerJobId === row.discovery.providerJobId, 'Batch requisition identity differs from candidate');
      mapping.push({...ref, fingerprint: fingerprint(row), source: row.discovery.source.label});
    }
    const sha256 = digest(raw);
    const existing = state.imports.find(item => item.filename === input.batch && item.sha256 === sha256);
    if (existing) {
      check(JSON.stringify(existing.mapping) === JSON.stringify(mapping), 'Existing snapshot has a different candidate mapping');
      return {importId: existing.id, reused: true};
    }
    const item = {id: randomUUID(), filename: input.batch, raw, sha256, mapping, attempts: []};
    state.imports.push(item); await save(directory, state); return {importId: item.id, candidates: mapping.length};
  });
}
function validReceipt(item, result) {
  check(result && result.sha256 === item.sha256 && result.batch === item.filename && result.dryRun === false, 'Report does not match submitted batch');
  check([0, 2, 3, 4, 5].includes(result.exitCode), 'Invalid import result');
  if ([0, 5].includes(result.exitCode)) {
    check(timestamp(result.importedAt) && result.runId === JSON.parse(item.raw).runId && ['imported', 'partial'].includes(result.status), 'Invalid successful report metadata');
    check(Array.isArray(result.outcomes) && result.outcomes.length === item.mapping.length, 'Report does not account for every candidate');
    const indexes = new Set();
    for (const outcome of result.outcomes) {
      check(Number.isInteger(outcome.index) && outcome.index >= 0 && outcome.index < item.mapping.length && !indexes.has(outcome.index), 'Invalid report indices');
      indexes.add(outcome.index);
      check(['added', 'updated', 'unchanged', 'ambiguous', 'rejected'].includes(outcome.outcome), 'Unknown outcome');
      if (success.has(outcome.outcome)) check(text(outcome.id), 'Successful outcome lacks inventory id');
    }
  }
}
function reportPath(root, item) { return path.join(root, 'reports', item.filename.replace(/\.json$/, '.report.json')); }
async function recoverAttempts(root, item) {
  // A later retry's report cannot establish what happened during an earlier lost attempt.
  for (const attempt of item.attempts.slice(-1).filter(attempt => !attempt.receipt)) {
    const raw = await optionalRead(reportPath(root, item));
    if (!raw || digest(raw) === attempt.reportBefore) continue;
    const result = JSON.parse(raw);
    // An old report, or a report for a repaired batch, cannot settle this attempt.
    if (result.sha256 !== item.sha256 || !timestamp(result.importedAt) || Date.parse(result.importedAt) < Date.parse(attempt.startedAt)) continue;
    validReceipt(item, result);
    attempt.receipt = {...result, report: path.relative(root, reportPath(root, item))}; attempt.recoveredAt = now();
  }
}
export async function reconcileRun(root, runId) {
  return locked(root, runId, async directory => {
    const {state} = await readRun(root, runId);
    for (const item of state.imports) await recoverAttempts(root, item);
    await save(directory, state);
    return {unresolvedAttempts: state.imports.flatMap(item => item.attempts.filter(attempt => !attempt.receipt).map(attempt => ({importId: item.id, attemptId: attempt.id, outcome: 'unknown'})))};
  });
}
export async function executeImport(root, runId, input, hooks = {}) {
  fields(input, ['importId', 'retryReason', 'allowUnknown']);
  return locked(root, runId, async directory => {
    const {state} = await readRun(root, runId), item = state.imports.find(item => item.id === input.importId);
    check(item, 'Unknown prepared import');
    check(blockers(state, await profileRevision(root)).length === 0, 'Run blocked; inspect next');
    for (const ref of item.mapping) {
      const {rows} = await readLedger(await runDirectory(root, ref.runId));
      const row = rows.find(row => row.id === ref.id);
      check(row && fingerprint(row) === ref.fingerprint && row.assessment?.profileRevision === state.profileRevision && sourceAllowed(state, ref.source), 'Candidate changed or out of scope; prepare a fresh batch');
    }
    await recoverAttempts(root, item);
    const last = item.attempts.at(-1);
    if (last?.receipt?.exitCode === 0 && !last.receipt.ambiguous && !last.receipt.reportError) {
      await save(directory, state); return {alreadyConfirmed: true, unknownOriginalOutcomes: item.attempts.some(attempt => !attempt.receipt), result: last.receipt};
    }
    if (last) {
      check(text(input.retryReason), 'Retry needs an explicit reason');
      check(!item.attempts.some(attempt => attempt.receipt?.ambiguous || attempt.receipt?.rejected), 'Repair ambiguous/rejected records into a new batch snapshot before retry');
      if (item.attempts.some(attempt => !attempt.receipt)) check(input.allowUnknown === true, 'Unknown prior outcome; reconcile first, then explicitly authorize idempotent retry');
    }
    // Import from the saved snapshot, so later edits to incoming cannot change this attempt.
    const snapshotDirectory = path.join(directory, 'import-snapshots', item.id);
    await mkdir(snapshotDirectory, {recursive: true});
    check(await realpath(snapshotDirectory) === snapshotDirectory, 'Snapshot directory must not be redirected');
    const snapshot = path.join(snapshotDirectory, item.filename);
    // Preserve exact bytes: report hashes include formatting and BOM removal used by importer.
    try { await writeFile(snapshot, item.raw, {encoding: 'utf8', flag: 'wx'}); }
    catch (error) {
      if (error.code !== 'EEXIST') throw error;
      check(!(await lstat(snapshot)).isSymbolicLink() && digest(await readFile(snapshot, 'utf8')) === item.sha256, 'Snapshot was changed; preserve and inspect it');
    }
    const validation = await importBatch({root, batchPath: snapshot, validateOnly: true});
    check([0, 5].includes(validation.exitCode), `Batch validation failed: ${(validation.errors || []).join('; ')}`);
    const previousReport = await optionalRead(reportPath(root, item));
    const attempt = {id: randomUUID(), startedAt: now(), reportBefore: previousReport === null ? null : digest(previousReport), receipt: null, retryReason: input.retryReason || ''};
    item.attempts.push(attempt); await save(directory, state);
    if (hooks.afterIntent) await hooks.afterIntent();
    const result = await importBatch({root, batchPath: snapshot, lock: {timeoutMs: 1000}});
    if (hooks.afterImport) await hooks.afterImport(result);
    // Failure reports from the legacy importer may omit a digest. The in-process
    // return still belongs to this immutable snapshot; label that binding explicitly.
    const receipt = result.sha256 ? result : {...result, sha256: item.sha256, snapshotBoundByWrapper: true};
    validReceipt(item, receipt); attempt.receipt = receipt; await save(directory, state);
    return {importId: item.id, attemptId: attempt.id, unknownOriginalOutcomes: item.attempts.some(attempt => !attempt.receipt), result};
  });
}

// Read-only cross-run discovery. No inferred completion, automatic retries or new network work.
export async function outstanding(root, currentRunId = null) {
  const directory = await runsDirectory(root), profile = await profileRevision(root);
  const current = currentRunId ? (await readRun(root, currentRunId)).state : null;
  const runs = [], warnings = [], delivered = new Set();
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) { warnings.push({runId: entry.name, reason: 'Not an ordinary run directory; preserved'}); continue; }
    let state = null, rows = [];
    try {
      if (await optionalRead(path.join(directory, entry.name, 'run-completion.json')) !== null) state = (await readRun(root, entry.name)).state;
      if (await optionalRead(path.join(directory, entry.name, 'run-ledger.jsonl')) !== null) rows = (await readLedger(path.join(directory, entry.name))).rows;
      for (const item of state?.imports || []) for (const attempt of item.attempts) if (attempt.receipt) {
        validReceipt(item, attempt.receipt);
        for (const outcome of attempt.receipt.outcomes || []) if (success.has(outcome.outcome)) {
          const ref = item.mapping[outcome.index];
          delivered.add(`${ref.runId}/${ref.id}/${ref.fingerprint}`);
        }
      }
      runs.push({runId: entry.name, state, rows});
    } catch (error) { warnings.push({runId: entry.name, reason: error.message}); }
  }
  return {
    profileRevision: profile,
    blockers: current ? blockers(current, profile) : [], warnings,
    runs: runs.map(({runId, state, rows}) => ({
      runId,
      blockers: state ? blockers(state, profile) : ['Capture-only run; use current scope to assess candidates'],
      tasks: (state?.tasks || []).filter(task => !terminal.has(task.status)).map(task => ({...task,
        allowedNow: !!current && blockers(current, profile).length === 0 && sourceAllowed(current, task.source) && (task.maxCalls === null || task.calls < task.maxCalls),
        resumeIn: currentRunId, note: 'Carry task forward explicitly; saved cursors need overlap/deduplication'
      })),
      candidates: rows.filter(row => {
        const stale = (row.assessment?.profileRevision || row.profileRevision) !== profile;
        return row.state === 'pending' || row.state === 'assessed' && (stale || !delivered.has(`${runId}/${row.id}/${fingerprint(row)}`)) || ['excluded', 'duplicate'].includes(row.state) && stale;
      }).map(row => ({id: row.id, company: row.discovery.company, title: row.discovery.title, state: row.state,
        needsReassessment: (row.assessment?.profileRevision || row.profileRevision) !== profile,
        allowedNow: !!current && blockers(current, profile).length === 0 && sourceAllowed(current, row.discovery.source.label)
      })),
      imports: (state?.imports || []).filter(item => {
        const unknown = item.attempts.some(attempt => !attempt.receipt);
        const undelivered = item.mapping.some(ref => !delivered.has(`${ref.runId}/${ref.id}/${ref.fingerprint}`));
        return unknown || undelivered || item.attempts.at(-1)?.receipt?.reportError || !item.mapping.length && !item.attempts.length;
      }).map(item => ({id: item.id, filename: item.filename, unknownOriginalOutcomes: item.attempts.some(attempt => !attempt.receipt), attempts: item.attempts.map(attempt => ({id: attempt.id, status: attempt.receipt?.status || 'unknown', reportError: attempt.receipt?.reportError || null}))})),
      retention: 'preserve' // Receipts can be referenced by other runs. No age-only deletion.
    })).filter(run => run.tasks.length || run.candidates.length || run.imports.length || run.runId === currentRunId && run.blockers.length)
  };
}

export async function summarizeRun(root, runId) {
  const {state} = await readRun(root, runId);
  const queue = await outstanding(root, runId);
  const directory = await runDirectory(root, runId);
  const rows = await optionalRead(path.join(directory, 'run-ledger.jsonl')) === null ? [] : (await readLedger(directory)).rows;
  const candidates = {total: rows.length, pending: 0, assessed: 0, excluded: 0, duplicate: 0};
  for (const row of rows) candidates[row.state]++;
  const tasks = {};
  for (const task of state.tasks) {
    const counts = tasks[task.kind] ||= {total: 0, ...Object.fromEntries(statuses.map(status => [status, 0]))};
    counts.total++; counts[task.status] = (counts[task.status] || 0) + 1;
  }
  // Count each candidate once, retaining its first confirmed storage outcome across retries.
  const outcomes = new Map(), unknown = [], unattempted = [];
  for (const item of state.imports) {
    if (!item.attempts.length) unattempted.push(item.id);
    for (const attempt of item.attempts) {
      if (!attempt.receipt) { unknown.push({importId: item.id, attemptId: attempt.id}); continue; }
      validReceipt(item, attempt.receipt);
      for (const result of attempt.receipt.outcomes || []) {
        const ref = item.mapping[result.index], key = ref.runId + '/' + ref.id;
        if (!success.has(outcomes.get(key))) outcomes.set(key, result.outcome);
      }
    }
  }
  const imports = {added: 0, updated: 0, unchanged: 0, ambiguous: 0, rejected: 0};
  for (const outcome of outcomes.values()) imports[outcome]++;
  return {runId, startedAt: state.startedAt, generatedAt: now(), candidates, tasks,
    imports: {confirmedUniqueCandidates: imports, unknownAttempts: unknown, unattempted,
      originalCountsKnown: unknown.length === 0, originalCounts: unknown.length ? null : imports},
    unfinishedTasks: state.tasks.filter(task => !terminal.has(task.status)).map(({id, status, reason, nextAction}) => ({id, status, reason, nextAction})),
    outstanding: queue,
    limitations: ['Task counts are declared work items, not verified source coverage.',
      'Source page, email and tool-call metrics not recorded in state are unknown; do not invent zeros.',
      'Import counts cover this run receipts, including candidates captured in older runs; candidate counts cover this run ledger.',
      'Confirmed outcomes do not reconstruct missing original import outcomes. Read between writes with a single lead writer.']};
}

async function cli() {
  const [command, ...args] = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    check(['--root', '--run', '--input'].includes(args[i]) && args[i + 1] && !options[args[i]], 'Invalid arguments'); options[args[i]] = args[i + 1];
  }
  check(options['--root'], 'Use --root DATA_DIRECTORY'); const root = path.resolve(options['--root']), runId = options['--run'];
  const input = options['--input'] ? JSON.parse((await readFile(options['--input'], 'utf8')).replace(/^\uFEFF/, '')) : {};
  if (command === 'next') return outstanding(root, runId || null);
  check(runId, 'Use --run RUN_ID');
  if (command === 'summary') return summarizeRun(root, runId);
  if (command === 'init') return initializeRun(root, runId, input);
  if (command === 'read') {
    const {state, revision} = await readRun(root, runId);
    return {revision, ...state, imports: state.imports.map(item => ({id: item.id, filename: item.filename, sha256: item.sha256, candidates: item.mapping.length, attempts: item.attempts.map(attempt => ({id: attempt.id, status: attempt.receipt?.status || 'unknown', reportError: attempt.receipt?.reportError || null}))}))};
  }
  if (command === 'receipt') {
    fields(input, ['importId', 'attemptId']);
    const {state} = await readRun(root, runId), item = state.imports.find(item => item.id === input.importId);
    check(item, 'Unknown import');
    const attempt = input.attemptId ? item.attempts.find(attempt => attempt.id === input.attemptId) : item.attempts.at(-1);
    check(attempt, 'Unknown attempt'); return {importId: item.id, ...attempt};
  }
  if (['task', 'context', 'resume', 'stop'].includes(command)) return updateRun(root, runId, command, input);
  if (command === 'prepare') return prepareImport(root, runId, input);
  if (command === 'import') return executeImport(root, runId, input);
  if (command === 'reconcile') return reconcileRun(root, runId);
  throw Error('Commands: init, read, next, task, context, resume, stop, prepare, import, reconcile, receipt, summary');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().then(result => { console.log(JSON.stringify(result)); if (result.result?.exitCode) process.exitCode = result.result.exitCode; })
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}
