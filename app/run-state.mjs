// Live run manifest, cross-run pending work and derived summary. Never writes inventory.
import {readFile, mkdir, readdir, lstat, realpath, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {writeJsonAtomic} from './store.mjs';
import {readLedger, initializeLedger} from './candidate-ledger.mjs';
import {strongKeys, normCompany, normTitle} from './import-discoveries.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const terminal = new Set(['done', 'not_due', 'excluded']);
const kinds = ['alerts', 'posting', 'refresh', 'employer', 'portal', 'gap', 'recheck', 'import', 'coverage', 'summary'];
const statuses = ['pending', 'active', 'done', 'partial', 'deferred', 'failed', 'not_due', 'excluded'];
const outcomes = ['added', 'updated', 'unchanged', 'ambiguous', 'rejected'];
function check(test, message) { if (!test) throw Error(message); }
function text(value) { return typeof value === 'string' && value.trim().length > 0 && value.length <= 4000; }
function name(value) { check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(value), 'Invalid run or file identifier'); return value; }
function timestamp(value) { return typeof value === 'string' && /^\d{4}-\d\d-\d\dT.*Z$/.test(value) && Number.isFinite(Date.parse(value)); }
function fields(value, allowed) {
  check(value && typeof value === 'object' && !Array.isArray(value), 'Expected object');
  const unknown = Object.keys(value).filter(key => !allowed.includes(key));
  check(!unknown.length, `Unknown fields: ${unknown.join(', ')}`);
}
function scopeOf(scope = {}) {
  fields(scope, ['sources', 'exclusions']);
  const result = {sources: scope.sources ?? ['*'], exclusions: scope.exclusions ?? []};
  check(Array.isArray(result.sources) && result.sources.length > 0 && result.sources.every(text), 'Scope sources must be source labels (or *)');
  check(Array.isArray(result.exclusions), 'Scope exclusions must be an array');
  for (const item of result.exclusions) { fields(item, ['source', 'reason']); check(text(item.source) && text(item.reason), 'Exclusion needs source and reason'); }
  return result;
}
// Missing text fields default to empty so callers send only what they know.
function taskOf(input) {
  fields(input, ['id', 'kind', 'source', 'status', 'nextAction', 'reason', 'evidence', 'cursor']);
  const task = {nextAction: '', reason: '', evidence: '', cursor: null, ...input};
  check(text(task.id) && text(task.source), 'Task needs id and source');
  check(kinds.includes(task.kind), `Task kind must be one of: ${kinds.join(', ')}`);
  check(statuses.includes(task.status), `Task status must be one of: ${statuses.join(', ')}`);
  check(['nextAction', 'reason', 'evidence'].every(key => typeof task[key] === 'string'), 'Task text fields must be strings');
  check(task.cursor === null || text(task.cursor), 'Cursor must be null or a short hint');
  if (task.status === 'done') check(text(task.evidence), 'Done needs evidence');
  if (['partial', 'deferred', 'failed', 'not_due', 'excluded'].includes(task.status)) check(text(task.reason), `${task.status} needs a reason`);
  if (['partial', 'deferred', 'failed'].includes(task.status)) check(text(task.nextAction), `${task.status} needs nextAction for the next run`);
  return task;
}
function stateValid(state) {
  fields(state, ['schemaVersion', 'runId', 'startedAt', 'updatedAt', 'profileRevision', 'scope', 'tasks']);
  check(state.schemaVersion === 2, 'Unsupported run state; preserved as legacy');
  name(state.runId);
  check(timestamp(state.startedAt) && timestamp(state.updatedAt) && /^[a-f0-9]{64}$/.test(state.profileRevision), 'Invalid run metadata');
  scopeOf(state.scope);
  check(Array.isArray(state.tasks), 'Missing tasks');
  const ids = new Set();
  for (const task of state.tasks) { taskOf(task); check(!ids.has(task.id), 'Duplicate task id'); ids.add(task.id); }
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
  const raw = await readFile(path.join(await runDirectory(root, runId), 'run-completion.json'), 'utf8');
  const state = JSON.parse(raw.replace(/^﻿/, '')); stateValid(state);
  check(state.runId === runId, 'Run folder does not match manifest');
  return state;
}
async function save(directory, state) { state.updatedAt = now(); stateValid(state); await writeJsonAtomic(path.join(directory, 'run-completion.json'), state); }

export async function initializeRun(root, runId, input = {}) {
  fields(input, ['scope', 'tasks']);
  const directory = await runDirectory(root, runId, true);
  return locked(root, runId, async () => {
    check(await optionalRead(path.join(directory, 'run-completion.json')) === null, 'Run already has a manifest; use task updates, never overwrite it');
    const state = {schemaVersion: 2, runId, startedAt: now(), updatedAt: now(), profileRevision: await profileRevision(root), scope: scopeOf(input.scope), tasks: (input.tasks || []).map(taskOf)};
    await initializeLedger(directory); await save(directory, state);
    return {runId, profileRevision: state.profileRevision, tasks: state.tasks.length};
  });
}
// Accepts one task or {tasks: [...]}: adds new ids, replaces existing ones.
export async function updateTasks(root, runId, input) {
  const list = input.tasks ?? [input.task ?? input];
  check(Array.isArray(list) && list.length > 0, 'No tasks given');
  return locked(root, runId, async directory => {
    const state = await readRun(root, runId);
    for (const task of list.map(taskOf)) {
      const previous = state.tasks.find(item => item.id === task.id);
      if (previous) Object.assign(previous, task); else state.tasks.push(task);
    }
    await save(directory, state);
    return {runId, updated: list.length, unfinished: state.tasks.filter(task => !terminal.has(task.status)).length};
  });
}

// Delivery is read from the inventory itself, so an interrupted or repeated import needs no receipts.
const nameKey = (company, title) => `name:${normCompany(company)}|${normTitle(title)}`;
const squash = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
async function inventory(root) {
  const raw = await optionalRead(path.join(root, 'jobs.json'));
  return raw === null ? [] : JSON.parse(raw.replace(/^﻿/, '')).jobs || [];
}
async function droppedList(root) {
  const raw = await optionalRead(path.join(root, 'reports', 'coverage.json'));
  return raw === null ? [] : (JSON.parse(raw.replace(/^﻿/, '')).dropped || []);
}
// Maps identity keys to {record, status} (inventory) or {status: 'dropped', reason} (coverage.json dropped list).
function matchIndex(entries, label) {
  const strong = new Map(), byName = new Map();
  for (const entry of entries) {
    const hit = label(entry);
    // Strong keys are company-qualified: the importer treats a shared id at another employer as ambiguous.
    for (const key of strongKeys({...entry, linkType: entry.linkType || 'posting'}).keys) strong.set(key + '@' + normCompany(entry.company), hit);
    const key = nameKey(entry.company, entry.title);
    byName.set(key, [...(byName.get(key) || []), {place: squash([entry.locationRaw, entry.city].join(' ')), hit}]);
  }
  return {strong, byName};
}
// shortcut: name fallback needs company+title and a location substring (dropped entries carry no location, so they match by ID/URL only); aliases or reworded titles stay unmatched and are resolved by the agent.
function match(index, discovery) {
  const keys = strongKeys({provider: discovery.provider, providerJobId: discovery.providerJobId, url: discovery.url, linkType: discovery.url ? 'posting' : 'search'}).keys;
  for (const key of keys) { const hit = index.strong.get(key + '@' + normCompany(discovery.company)); if (hit) return hit; }
  const location = squash(discovery.location);
  return (index.byName.get(nameKey(discovery.company, discovery.title)) || []).find(({place}) => discovery.location === 'Unknown' || place && (place.includes(location) || location.includes(place)))?.hit || null;
}
const excludedSource = (state, source) => !!state && (!(state.scope.sources.includes('*') || state.scope.sources.includes(source)) || state.scope.exclusions.some(item => item.source === source));

// Read-only cross-run discovery. No inferred completion, retries or network work.
export async function outstanding(root, currentRunId = null) {
  const directory = await runsDirectory(root), profile = await profileRevision(root);
  const current = currentRunId ? await readRun(root, currentRunId) : null;
  const stored = matchIndex(await inventory(root), job => ({record: job.id, status: job.status}));
  const dropped = matchIndex(await droppedList(root), entry => ({status: 'dropped', reason: entry.reason}));
  const runs = [], warnings = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.isSymbolicLink()) { warnings.push({runId: entry.name, reason: 'Not an ordinary run directory; preserved'}); continue; }
    const folder = path.join(directory, entry.name);
    let state = null, rows = [];
    try { if (await optionalRead(path.join(folder, 'run-completion.json')) !== null) state = await readRun(root, entry.name); }
    catch (error) { warnings.push({runId: entry.name, reason: `Manifest: ${error.message}`}); }
    try { if (await optionalRead(path.join(folder, 'run-ledger.jsonl')) !== null) rows = (await readLedger(folder)).rows; }
    catch (error) { warnings.push({runId: entry.name, reason: `Ledger: ${error.message}`}); }
    const stale = row => (row.assessment?.profileRevision || row.profileRevision) !== profile;
    const tasks = (state?.tasks || []).filter(task => !terminal.has(task.status))
      .map(task => ({...task, excludedNow: excludedSource(current, task.source)}));
    // A duplicate points at a record or candidate that is reassessed itself, so only exclusions go stale.
    const candidates = rows.filter(row => row.state === 'pending'
        || row.state === 'assessed' && !match(stored, row.discovery)
        || row.state === 'excluded' && stale(row))
      .map(row => {
        const known = row.state === 'pending' ? match(stored, row.discovery) || match(dropped, row.discovery) : null;
        return {id: row.id, company: row.discovery.company, title: row.discovery.title, state: row.state,
          ...(known && {known}), needsReassessment: row.state !== 'pending' && stale(row), excludedNow: excludedSource(current, row.discovery.source.label)};
      });
    if (tasks.length || candidates.length) runs.push({runId: entry.name, tasks, candidates});
  }
  return {profileRevision: profile, profileChanged: !!current && current.profileRevision !== profile, warnings, runs};
}

// Records whose first source is this run's batch were added by this run, however many attempts it took.
export async function summarizeRun(root, runId) {
  const state = await readRun(root, runId), directory = await runDirectory(root, runId);
  const rows = await optionalRead(path.join(directory, 'run-ledger.jsonl')) === null ? [] : (await readLedger(directory)).rows;
  const candidates = {total: rows.length, pending: 0, assessed: 0, excluded: 0, duplicate: 0};
  for (const row of rows) candidates[row.state]++;
  const tasks = {};
  for (const task of state.tasks) {
    const counts = tasks[task.kind] ||= {total: 0, ...Object.fromEntries(statuses.map(status => [status, 0]))};
    counts.total++; counts[task.status]++;
  }
  const batch = new RegExp(`^\\d{4}-\\d\\d-\\d\\d-${runId.replace(/\./g, '\\.')}\\.json$`);
  const ours = job => (job.sources || []).some(source => batch.test(source.file || ''));
  const jobs = await inventory(root);
  const added = jobs.filter(job => batch.test(job.sources?.[0]?.file || ''));
  const reportsDirectory = path.join(root, 'reports');
  const reports = [];
  for (const file of (await readdir(reportsDirectory).catch(() => [])).filter(file => batch.test(file.replace(/(\.failed-\d+)?\.report\.json$/, '.json')) && file.endsWith('.report.json')).sort()) {
    const report = JSON.parse((await readFile(path.join(reportsDirectory, file), 'utf8')).replace(/^﻿/, ''));
    reports.push({file, status: report.status, exitCode: report.exitCode, importedAt: report.importedAt, reportError: report.reportError || null,
      ...Object.fromEntries(outcomes.map(outcome => [outcome, report[outcome] ?? 0])),
      unresolved: (report.outcomes || []).filter(item => ['ambiguous', 'rejected'].includes(item.outcome)).map(({index, company, title, outcome}) => ({index, company, title, outcome}))});
  }
  return {runId, startedAt: state.startedAt, generatedAt: now(), candidates, tasks,
    inventory: {addedThisRun: added.map(({id, fit, company, title, availability, assessmentBasis, url}) => ({id, fit, company, title, availability, assessmentBasis, url})),
      touchedThisRun: jobs.filter(ours).length},
    importReports: reports,
    unfinishedTasks: state.tasks.filter(task => !terminal.has(task.status)).map(({id, status, reason, nextAction}) => ({id, status, reason, nextAction})),
    outstanding: await outstanding(root, runId),
    limitations: ['Task counts are declared work items, not verified source coverage.',
      'Metrics not recorded in saved state are unknown; do not invent zeros.',
      'addedThisRun is read from the inventory; candidate counts cover this run ledger only.']};
}

async function cli() {
  const [command, ...args] = process.argv.slice(2), options = {};
  for (let i = 0; i < args.length; i += 2) {
    check(['--root', '--run', '--input'].includes(args[i]) && args[i + 1] && !options[args[i]], 'Invalid arguments'); options[args[i]] = args[i + 1];
  }
  check(options['--root'], 'Use --root DATA_DIRECTORY'); const root = path.resolve(options['--root']), runId = options['--run'];
  const input = options['--input'] ? JSON.parse((await readFile(options['--input'], 'utf8')).replace(/^﻿/, '')) : {};
  if (command === 'next') return outstanding(root, runId || null);
  check(runId, 'Use --run RUN_ID');
  if (command === 'init') return initializeRun(root, runId, input);
  if (command === 'task') return updateTasks(root, runId, input);
  if (command === 'read') return readRun(root, runId);
  if (command === 'summary') return summarizeRun(root, runId);
  throw Error('Commands: init, task, read, next, summary');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
