// Search run state: start a run, capture and check finds, save decisions, derive the summary. Never writes inventory.
import {readFile, writeFile, mkdir, readdir, lstat, realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, randomBytes} from 'node:crypto';
import {writeJsonAtomic} from './store.mjs';
import {readLedger, initializeLedger, changeLedger} from './candidate-ledger.mjs';
import {strongKeys, normCompany, normTitle} from './import-discoveries.mjs';

const digest = value => createHash('sha256').update(value).digest('hex');
const now = () => new Date().toISOString();
const outcomes = ['added', 'updated', 'unchanged', 'ambiguous', 'rejected'];
const short = id => id.slice(0, 8);
function check(test, message) { if (!test) throw Error(message); }
function name(value) { check(typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(value), 'Invalid run identifier'); return value; }
const parse = raw => JSON.parse(raw.replace(/^﻿/, ''));
async function optionalRead(file) { try { return await readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
export async function profileRevision(root) { return digest(await readFile(path.resolve(root, '../profile/candidate_profile.md'))); }
async function runsDirectory(root) {
  const directory = path.join(await realpath(root), 'reports', 'runs');
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
// The current run id lives inside ROOT, so no command needs it and no shell has to remember it.
const pointer = root => path.join(root, 'reports', 'runs', 'CURRENT');
async function currentRun(root, runId) {
  const id = runId || (await optionalRead(pointer(root)))?.trim();
  check(id, 'No current run; start one with init');
  return name(id);
}
export async function readRun(root, runId) {
  const state = parse(await readFile(path.join(await runDirectory(root, runId), 'run-completion.json'), 'utf8'));
  check([2, 3].includes(state.schemaVersion) && state.runId === runId && /^[a-f0-9]{64}$/.test(state.profileRevision), 'Unsupported or mismatched run manifest');
  return state;
}

const pad = n => String(n).padStart(2, '0');
const localDate = date => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const reserved = new Set(['run-ledger.jsonl', 'run-completion.json', 'source-evidence.jsonl']);
async function describe(root, state, resumed) {
  const data = path.basename(root);
  return {runId: state.runId, folder: `${data}/reports/runs/${state.runId}`, batch: `${data}/incoming/${localDate(new Date(state.startedAt))}-${state.runId}.json`,
    ...(resumed && {resumed: true}), ...await outstanding(root, state.runId, resumed)};
}
export async function initializeRun(root, runId = null) {
  const started = new Date();
  if (!runId) {
    // A same-day run never summarized is continued, so a restarted session keeps its finds, extracts and batch name.
    const open = (await optionalRead(pointer(root)))?.trim(), state = open && await readRun(root, open).catch(() => null);
    if (state?.schemaVersion === 3 && !state.finishedAt && localDate(new Date(state.startedAt)) === localDate(started)) return describe(root, state, true);
  }
  runId = name(runId || `run-${started.toISOString().replace(/\D/g, '').slice(0, 12)}-${randomBytes(2).toString('hex')}`);
  const directory = await runDirectory(root, runId, true), manifest = path.join(directory, 'run-completion.json');
  check(await optionalRead(manifest) === null, 'Run already exists; never overwrite it');
  const profile = await profileRevision(root);
  await initializeLedger(directory);
  const state = {schemaVersion: 3, runId, startedAt: started.toISOString(), profileRevision: profile};
  await writeJsonAtomic(manifest, state);
  await writeFile(pointer(root), runId + '\n');
  return describe(root, state, false);
}
// Files the helper has read are listed in their run's manifest, so init can point at result files an interruption left uncaptured.
async function noteInputs(root, files) {
  const runs = await runsDirectory(root);
  for (const file of files) {
    const folder = await realpath(path.dirname(path.resolve(file)));
    if (path.dirname(folder) !== runs) continue;
    const manifest = path.join(folder, 'run-completion.json'), raw = await optionalRead(manifest);
    if (raw === null) continue;
    const state = parse(raw);
    await writeJsonAtomic(manifest, {...state, inputs: [...new Set([...(state.inputs || []), path.basename(file)])]});
  }
}
async function uncaptured(root, run, folder) {
  const state = parse(await optionalRead(path.join(folder, 'run-completion.json')) ?? 'null');
  if (state?.schemaVersion !== 3 || state.finishedAt) return [];
  const used = new Set(state.inputs || []);
  return (await readdir(folder, {withFileTypes: true})).filter(file => file.isFile() && /\.jsonl?$/.test(file.name) && !reserved.has(file.name) && !used.has(file.name))
    .map(file => `${path.basename(root)}/reports/runs/${run}/${file.name}`);
}

// Identity matching against the inventory (any status) and the coverage.json dropped list.
const nameKey = (company, title) => `${normCompany(company)}|${normTitle(title)}`;
const squash = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const findKeys = discovery => [...strongKeys({provider: discovery.provider, providerJobId: discovery.providerJobId, url: discovery.url, linkType: discovery.url ? 'posting' : 'search'}).keys];
async function inventory(root) { const raw = await optionalRead(path.join(root, 'jobs.json')); return raw === null ? [] : parse(raw).jobs || []; }
async function droppedList(root) { const raw = await optionalRead(path.join(root, 'reports', 'coverage.json')); return raw === null ? [] : parse(raw).dropped || []; }
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
async function indexes(root) {
  return {stored: matchIndex(await inventory(root), job => `${job.id} (${job.status})`),
    dropped: matchIndex(await droppedList(root), entry => `dropped: ${entry.reason}`)};
}
const strongMatch = (index, discovery) => findKeys(discovery).map(key => index.strong.get(key + '@' + normCompany(discovery.company))).find(Boolean) || null;
// shortcut: name match needs company+title and a location substring; aliases or reworded titles are left to the agent.
const nameMatch = (index, discovery) => {
  const location = squash(discovery.location);
  return (index.byName.get(nameKey(discovery.company, discovery.title)) || []).find(({place}) => discovery.location === 'Unknown' || place && (place.includes(location) || location.includes(place)))?.hit || null;
};
// Delivery needs a shared ID or URL; a name match proves it only for finds that carry neither (alert titles without links).
const delivered = (index, discovery) => strongMatch(index, discovery) || (!findKeys(discovery).length && nameMatch(index, discovery));

// Accepts {candidates:[...]}, a JSON array, or JSONL from a subagent result file; extra fields are ignored.
function findsOf(raw, file) {
  const text = raw.replace(/^﻿/, '').trim();
  let whole = null; try { whole = JSON.parse(text); } catch { /* not one JSON document: read as JSONL */ }
  const items = Array.isArray(whole) ? whole : whole?.candidates ?? (whole ? [whole] : text.split(/\r?\n/).filter(line => line.trim()).map(line => JSON.parse(line)));
  check(Array.isArray(items) && items.length, 'No finds in input');
  return items.map((item, index) => {
    const pick = (...keys) => { for (const key of keys) if (item[key] !== undefined && item[key] !== null && String(item[key]).trim()) return String(item[key]).trim(); };
    const source = typeof item.source === 'object' && item.source ? item.source : {label: pick('source', 'sourceLabel') || path.basename(file, path.extname(file))};
    const find = {company: pick('company'), title: pick('title', 'advertisedTitle'), location: pick('location', 'locationRaw') || 'Unknown',
      source: {label: source.label, ref: source.ref || pick('ref', 'mailId', 'mail') || `${path.basename(file)}:${index + 1}`}};
    const url = pick('url', 'postingUrl'); if (url && /^https?:/i.test(url)) find.url = url;
    const id = pick('providerJobId', 'jobId', 'requisitionId'), provider = pick('provider');
    if (id && provider) Object.assign(find, {provider, providerJobId: id});
    check(find.company && find.title, `Find ${index + 1} needs company and title`);
    return find;
  });
}
// Actionable rows (pending, assessed, excluded) of the same identity in earlier runs.
async function earlierRows(root, runId) {
  const rows = new Map(), directory = await runsDirectory(root);
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (!entry.isDirectory() || entry.name === runId) continue;
    try {
      for (const row of (await readLedger(path.join(directory, entry.name))).rows)
        if (row.state !== 'duplicate') rows.set(row.id, [...(rows.get(row.id) || []), {run: entry.name, row}]);
    } catch { /* legacy or unreadable ledgers are reported by init, not here */ }
  }
  return rows;
}
// Capture first, then mark finds already stored or dropped as duplicate, so they are never read or rated.
export async function captureFinds(root, files, runId = null) {
  runId = await currentRun(root, runId);
  const directory = await runDirectory(root, runId), finds = [];
  for (const file of files) finds.push(...findsOf(await readFile(file, 'utf8'), file));
  const {affected} = await changeLedger(directory, 'capture', {candidates: finds});
  const profile = await profileRevision(root), {stored: inv, dropped} = await indexes(root), earlier = await earlierRows(root, runId);
  const rows = new Map((await readLedger(directory)).rows.map(row => [row.id, row]));
  const result = {runId, captured: affected.length, new: [], known: [], similar: [], decidedBefore: []}, updates = [], superseded = new Map();
  for (const id of affected) {
    const row = rows.get(id), d = row.discovery, line = {id: short(id), company: d.company, title: d.title, location: d.location, ...(d.url && {url: d.url})};
    if (row.state !== 'pending') continue;
    const hit = strongMatch(inv, d) || strongMatch(dropped, d);
    if (hit) { updates.push({id, state: 'duplicate', reason: hit, profileRevision: profile}); result.known.push({...line, match: hit}); continue; }
    // One actionable entry per vacancy: earlier rows point here, and a current-profile decision is copied onto today's row.
    const before = earlier.get(id) || [];
    for (const {run} of before) superseded.set(run, [...(superseded.get(run) || []), {id, state: 'duplicate', reason: `Carried into run ${runId}`, profileRevision: profile}]);
    const decision = before.filter(({row}) => row.state !== 'pending' && (row.assessment?.profileRevision || row.profileRevision) === profile)
      .sort((a, b) => a.row.updatedAt.localeCompare(b.row.updatedAt)).at(-1);
    if (decision) {
      const {row: earlierRow} = decision;
      updates.push(earlierRow.state === 'assessed' ? {id, state: 'assessed', assessment: earlierRow.assessment} : {id, state: 'excluded', reason: earlierRow.reason, profileRevision: profile});
      result.decidedBefore.push({...line, run: decision.run, state: earlierRow.state, ...(earlierRow.assessment ? {fit: earlierRow.assessment.fit, reasoning: earlierRow.assessment.reasoning} : {reason: earlierRow.reason})});
      continue;
    }
    const similar = nameMatch(inv, d);
    (similar ? result.similar : result.new).push(similar ? {...line, match: similar} : line);
  }
  if (updates.length) await changeLedger(directory, 'resolve', {updates});
  for (const [run, list] of superseded) await changeLedger(await runDirectory(root, run), 'resolve', {updates: list});
  return result;
}

// Flat decisions: {id (8+ characters), state, reason} or, for assessed, {id, state, basis, fit, reasoning, gaps?, evidence}.
export async function resolveFinds(root, input, runId = null) {
  runId = await currentRun(root, runId);
  const directory = await runDirectory(root, runId), list = Array.isArray(input) ? input : input.updates || input.decisions;
  check(Array.isArray(list) && list.length, 'Expected a list of decisions');
  const ids = (await readLedger(directory)).rows.map(row => row.id), profile = await profileRevision(root);
  const updates = list.map(entry => {
    const matches = typeof entry.id === 'string' && entry.id.length >= 8 ? ids.filter(id => id.startsWith(entry.id)) : [];
    check(matches.length === 1, `Unknown or ambiguous id ${entry.id}`);
    const id = matches[0];
    if (entry.state === 'pending') return {id, state: 'pending'};
    if (entry.state === 'assessed') {
      // No defaults that upgrade evidence: a rating is "Posting reviewed" only when the agent says so and cites what it read.
      check(['Title only', 'Posting reviewed'].includes(entry.basis), `Assessed ${entry.id} needs basis "Posting reviewed" or "Title only"`);
      check(typeof entry.reasoning === 'string' && entry.reasoning.trim(), `Assessed ${entry.id} needs reasoning`);
      check(entry.basis === 'Title only' || typeof entry.evidence === 'string' && entry.evidence.trim(), `Posting reviewed ${entry.id} needs evidence from the posting`);
      return {id, state: 'assessed', assessment: {fit: entry.fit ?? null, basis: entry.basis, reasoning: entry.reasoning, gaps: entry.gaps || '', evidence: entry.evidence || 'Title only', profileRevision: profile}};
    }
    check(['excluded', 'duplicate'].includes(entry.state), 'State must be assessed, excluded, duplicate or pending');
    return {id, state: entry.state, reason: entry.reason, profileRevision: profile};
  });
  await changeLedger(directory, 'resolve', {updates});
  return {runId, resolved: updates.length, ...await candidateCounts(directory)};
}
async function candidateCounts(directory) {
  const counts = {total: 0, pending: 0, assessed: 0, excluded: 0, duplicate: 0};
  for (const row of (await readLedger(directory)).rows) { counts.total++; counts[row.state]++; }
  return {candidates: counts};
}

// Work carried from earlier runs: undecided finds, assessed finds not in the inventory, exclusions made under another profile.
export async function outstanding(root, currentRunId = null, includeCurrent = false) {
  const directory = await runsDirectory(root), profile = await profileRevision(root);
  const current = currentRunId ? await readRun(root, currentRunId) : null;
  const {stored: inv} = await indexes(root), carried = [], files = [], warnings = [];
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (entry.isFile()) continue;
    if (!entry.isDirectory()) { warnings.push({run: entry.name, reason: 'Not an ordinary run directory; preserved'}); continue; }
    if (entry.name === currentRunId && !includeCurrent || await optionalRead(path.join(directory, entry.name, 'run-ledger.jsonl')) === null) continue;
    let rows; try { rows = (await readLedger(path.join(directory, entry.name))).rows; }
    catch (error) { warnings.push({run: entry.name, reason: `Ledger: ${error.message}; preserved`}); continue; }
    try { files.push(...await uncaptured(root, entry.name, path.join(directory, entry.name))); }
    catch (error) { warnings.push({run: entry.name, reason: `Manifest: ${error.message}; preserved`}); }
    const stale = row => (row.assessment?.profileRevision || row.profileRevision) !== profile;
    // A duplicate points at a record or candidate that is reassessed itself, so only exclusions go stale.
    for (const row of rows) {
      const d = row.discovery, inInventory = delivered(inv, d), similar = !inInventory && nameMatch(inv, d);
      if (row.state === 'pending' && !inInventory || row.state === 'assessed' && !inInventory || row.state === 'excluded' && stale(row))
        carried.push({run: entry.name, id: short(row.id), state: row.state, company: d.company, title: d.title, location: d.location, ...(d.url && {url: d.url}),
          ...(row.assessment && {fit: row.assessment.fit, reasoning: row.assessment.reasoning, gaps: row.assessment.gaps}), ...(row.reason && {reason: row.reason}), ...(similar && {similar}), ...(row.state !== 'pending' && stale(row) && {reassess: true})});
    }
  }
  return {profileChanged: !!current && current.profileRevision !== profile, carried, uncaptured: files, warnings};
}

// Records whose first source is this run's batch were added by this run, however many attempts it took.
export async function summarizeRun(root, runId = null) {
  runId = await currentRun(root, runId);
  const state = await readRun(root, runId), directory = await runDirectory(root, runId);
  const batch = new RegExp(`^\\d{4}-\\d\\d-\\d\\d-${runId.replace(/\./g, '\\.')}\\.json$`);
  const jobs = await inventory(root), added = jobs.filter(job => batch.test(job.sources?.[0]?.file || ''));
  const reports = [], reportsDirectory = path.join(root, 'reports');
  for (const file of (await readdir(reportsDirectory).catch(() => [])).filter(file => file.endsWith('.report.json') && batch.test(file.replace(/(\.failed-\d+)?\.report\.json$/, '.json'))).sort()) {
    const report = parse(await readFile(path.join(reportsDirectory, file), 'utf8'));
    reports.push({file, status: report.status, exitCode: report.exitCode, reportError: report.reportError || null,
      ...Object.fromEntries(outcomes.map(outcome => [outcome, report[outcome] ?? 0])),
      unresolved: (report.outcomes || []).filter(item => ['ambiguous', 'rejected'].includes(item.outcome)).map(({index, company, title, outcome}) => ({index, company, title, outcome}))});
  }
  const {carried, warnings} = await outstanding(root, runId);
  await finish(root, state);
  return {runId, startedAt: state.startedAt, generatedAt: now(), ...await candidateCounts(directory),
    addedThisRun: added.map(({id, fit, company, title, availability, assessmentBasis, url}) => ({id, fit, company, title, availability, assessmentBasis, url})),
    touchedThisRun: jobs.filter(job => (job.sources || []).some(source => batch.test(source.file || ''))).length,
    importReports: reports, carriedFromEarlierRuns: carried.length, warnings};
}

// Summary ends the run, and any earlier unfinished one: their open finds stay carried, but init no longer resumes them or lists their files.
async function finish(root, state) {
  const directory = await runsDirectory(root);
  for (const entry of await readdir(directory, {withFileTypes: true})) {
    if (!entry.isDirectory()) continue;
    const manifest = path.join(directory, entry.name, 'run-completion.json');
    let other; try { other = parse(await optionalRead(manifest) ?? 'null'); } catch { continue; }
    if (other?.schemaVersion === 3 && !other.finishedAt && other.startedAt <= state.startedAt)
      await writeJsonAtomic(manifest, {...other, finishedAt: now(), ...(other.runId !== state.runId && {closedBy: state.runId})});
  }
}

async function cli() {
  const [command, ...args] = process.argv.slice(2), options = {}, inputs = [];
  for (let i = 0; i < args.length; i += 2) {
    check(['--root', '--run', '--input'].includes(args[i]) && args[i + 1], 'Invalid arguments');
    if (args[i] === '--input') inputs.push(args[i + 1]); else { check(!options[args[i]], 'Invalid arguments'); options[args[i]] = args[i + 1]; }
  }
  const root = path.resolve(options['--root'] || 'data'), runId = options['--run'];
  if (command === 'init') return initializeRun(root, runId);
  if (command === 'capture') { check(inputs.length, 'Use --input FILE (repeatable)'); const result = await captureFinds(root, inputs, runId); await noteInputs(root, inputs); return result; }
  if (command === 'resolve') { check(inputs.length === 1, 'Use --input FILE'); const result = await resolveFinds(root, parse(await readFile(inputs[0], 'utf8')), runId); await noteInputs(root, inputs); return result; }
  if (command === 'next') return outstanding(root, runId ? runId : (await optionalRead(pointer(root)))?.trim() || null);
  if (command === 'summary') return summarizeRun(root, runId);
  throw Error('Commands: init, capture, resolve, next, summary');
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
