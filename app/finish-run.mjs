// End-of-run bookkeeping for one search run, from the files in its run folder (ported from JobTracker scripts/finish-run.mjs, 4c855eb).
//   node app/finish-run.mjs [--today YYYY-MM-DD] <run-id>   (from ROOT)
//   node app/finish-run.mjs --retry-for <run-id>   retry list of the newest earlier run with a finish.json
// Reads in data/reports/runs/<run-id>/: run-ledger.jsonl, read-*.jsonl (one line per reading attempt), links-*.jsonl
// (link finder), refresh-*.jsonl (one line per Shortlisted record checked), evidence-*.jsonl, source-evidence.jsonl and
// due.json ({"employer": [names], "portal": [names]}: the sources due this run).
// Writes: finish.json (final outcome per source, counts, attribution, coverage, retry list), coverage.json `refreshed`
// (only records checked this run, dated by the run) and, last, `dropped` (record-dropped.mjs). Input files are not changed.
// Run it after the import and `--open`, before the summary. A repeated call, or a replay of an older run, gives the same result.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {findOf, rowsOf, strongIds, open} from './capture-check.mjs';
import {recordDropped} from './record-dropped.mjs';

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
const writeJson = (file, value) => { fs.writeFileSync(file + '.tmp', JSON.stringify(value, null, 1)); fs.renameSync(file + '.tmp', file); };
const filesOf = (folder, re) => fs.readdirSync(folder).filter(n => re.test(n)).sort().map(n => path.join(folder, n));
const linesOf = (folder, re) => filesOf(folder, re).flatMap(rowsOf);
// Reads and ledger lines name the company differently (page vs alert), so they are joined on ID or URL alone.
const looseKeys = row => strongIds(findOf(row)).map(k => k.replace(/@[^@]*$/, ''));
const count = (rows, f) => rows.reduce((acc, r) => { const k = f(r); acc[k] = (acc[k] || 0) + 1; return acc; }, {});
// Confirmed refresh results; anything else (unreadable, unconfirmed, error) is only an attempt.
const CONFIRMED = new Set(['open', 'closed', 'changed']);
const runDate = runId => (runId.match(/^run-(\d{4})(\d{2})(\d{2})/) || []).slice(1).join('-') || null;
const later = (a, b) => (a || '') >= (b || '') ? a : b;

export function finishRun(root, runId, today = new Date().toISOString().slice(0, 10)) {
  const folder = path.join(root, 'reports', 'runs', runId);
  const ledgerFile = path.join(folder, 'run-ledger.jsonl');
  if (!fs.existsSync(ledgerFile)) throw new Error(`${ledgerFile} not found`);
  const ledger = rowsOf(ledgerFile), jobs = readJson(path.join(root, 'jobs.json')).jobs || [];

  // Source evidence, the latest attempt per kind and source wins, by its `at` instant (UTC). Lines without a usable `at`
  // (older runs) are ordered by a hint only: subagent files by write time, then the lead's file. When undated lines
  // disagree with each other or with the dated outcome, the order is unknown: the source counts as partial (with all its
  // attempts kept for inspection) and goes on the retry list.
  const evidenceFile = path.join(folder, 'source-evidence.jsonl');
  const workerFiles = filesOf(folder, /^evidence-.*\.jsonl$/).sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs);
  const lines = [...workerFiles, ...(fs.existsSync(evidenceFile) ? [evidenceFile] : [])].flatMap(rowsOf);
  const instant = e => { const t = Date.parse(e.at); return Number.isNaN(t) ? null : t; };
  const bySource = new Map();
  for (const e of lines) { const k = `${e.kind}|${e.source}`; bySource.set(k, [...(bySource.get(k) || []), e]); }
  const evidence = new Map();
  for (const [k, list] of bySource) {
    const dated = list.filter(e => instant(e) !== null).sort((a, b) => instant(a) - instant(b)), undated = list.filter(e => instant(e) === null);
    const final = dated.length ? dated.at(-1) : undated.at(-1);
    const conflict = undated.some(e => e.status !== final.status);
    evidence.set(k, conflict ? {kind: final.kind, source: final.source, status: 'partial', error: `outcome order unknown: ${[...new Set(list.map(e => e.status))].join(', ')}`, attempts: list} : final);
  }
  // A due source without any evidence line was never checked.
  const dueFile = path.join(folder, 'due.json'), due = fs.existsSync(dueFile) ? readJson(dueFile) : null;
  const missing = due ? Object.entries(due).flatMap(([kind, names]) => (names || []).filter(n => !evidence.has(`${kind}|${n}`)).map(n => `${kind} ${n}: no evidence`))
    : ['due.json missing: due sources not reconciled'];
  const sources = {};
  for (const e of evidence.values()) { const s = sources[e.kind] ||= {}; s[e.status] = (s[e.status] || 0) + 1; }

  // Import: records whose first source came from this run's batch.
  const added = jobs.filter(j => String(j.sources?.[0]?.file || '').endsWith(`-${runId}.json`));
  const addedBySource = count(added, j => j.sources[0].label || 'unknown');

  // Reading attempts per candidate. A decision "Posting reviewed" needs a full read among them; a closure notice alone
  // supports Closed with "Title only", not a fit assessment.
  const reads = linesOf(folder, /^read-.*\.jsonl$/);
  const attemptsByKey = new Map();
  for (const r of reads) for (const k of looseKeys(r)) attemptsByKey.set(k, [...(attemptsByKey.get(k) || []), r]);
  const attemptsOf = row => [...new Set(looseKeys(row).flatMap(k => attemptsByKey.get(k) || []))];
  const reviewed = ledger.filter(r => r.basis === 'Posting reviewed');
  const ratedWithoutFull = [], noAttemptRecord = [];
  for (const r of reviewed) {
    const a = attemptsOf(r);
    if (!a.length) noAttemptRecord.push(`${r.company} | ${r.title} | ${r.state}`);
    else if (!a.some(x => x.text === 'full')) ratedWithoutFull.push(`${r.company} | ${r.title} | ${r.state}`);
  }
  const candidates = new Set(reads.map(r => looseKeys(r)[0] || `${r.company}|${r.advertisedTitle || r.title}`));

  // Link finder.
  const links = linesOf(folder, /^links-.*\.jsonl$/);
  const notFound = links.filter(l => !l.found);

  // Shortlisted refreshes: attempted vs confirmed, only for records actually checked, dated by the run's own date, so a
  // replay of an older run never moves a newer date.
  const observed = runDate(runId) || today;
  const coverageFile = path.join(root, 'reports', 'coverage.json');
  const coverage = readJson(coverageFile);
  const shortlisted = jobs.filter(j => j.status === 'Shortlisted').map(j => j.id);
  const refreshed = {};
  for (const [id, v] of Object.entries(coverage.refreshed || {})) if (shortlisted.includes(id)) refreshed[id] = typeof v === 'string' ? {lastAttemptedAt: v, lastConfirmedAt: v} : v;
  const refreshRows = linesOf(folder, /^refresh-.*\.jsonl$/), unconfirmed = [], unknownIds = [];
  for (const r of refreshRows) {
    const ref = String(r.jobId || r.id || ''), ids = ref ? shortlisted.filter(id => id === ref || id.startsWith(ref)) : [];
    if (ids.length !== 1) { unknownIds.push(ref || JSON.stringify(r).slice(0, 80)); continue; }
    const result = String(r.result || r.status || '').toLowerCase(), entry = refreshed[ids[0]] || {};
    refreshed[ids[0]] = {lastAttemptedAt: later(entry.lastAttemptedAt, observed), lastConfirmedAt: CONFIRMED.has(result) ? later(entry.lastConfirmedAt, observed) : entry.lastConfirmedAt || null};
    if (!CONFIRMED.has(result)) unconfirmed.push(`${r.company || ids[0]} ${ids[0].slice(0, 8)}: ${result || 'no result'}${r.error ? ' (' + String(r.error).slice(0, 80) + ')' : ''}`);
  }
  coverage.refreshed = refreshed;
  writeJson(coverageFile, coverage);

  // Every find of any run that still needs work (pending, assessed but not imported, reassess, …), as `--open` lists it,
  // so a run is never complete while a vacancy is undelivered (Codex review). The verb follows the label: a saved
  // assessment is imported, not rated again; a broken ledger entry is repaired; the rest is rated.
  const pending = open(root).slice(1).filter(l => l.startsWith('open | ')).map(l => l.slice('open | '.length));
  // A company or portal retry must name a real source: one in due.json, or (older runs without due.json) anything but a
  // script. Other lines, such as a script name, go to diagnostics, not retry.
  const isSource = e => !['employer', 'portal'].includes(e.kind) || (due ? (due[e.kind] || []).includes(e.source) : !/\.(m?js|cjs|py)$/i.test(e.source));
  const line = e => `${e.kind} ${e.source}: ${e.status}${e.error ? ' (' + String(e.error).slice(0, 100) + ')' : ''}`;
  const notChecked = [...evidence.values()].filter(e => e.status !== 'checked');
  const unchecked = notChecked.filter(isSource).map(line), diagnostics = notChecked.filter(e => !isSource(e)).map(line);
  // Carried source work stays owed until checked: leaving it out of due.json does not cancel it (a setup reset does).
  const listed = new Set([...unchecked, ...missing].map(keyOf));
  const carried = previousRetry(root, runId).retry.filter(item => keyOf(item) && evidence.get(keyOf(item))?.status !== 'checked' && !listed.has(keyOf(item)));
  const retry = [...unchecked, ...missing, ...carried, ...unconfirmed.map(u => `refresh ${u}`), ...unknownIds.map(id => `refresh ${id}: no Shortlisted record matches`),
    ...ratedWithoutFull.map(r => `reread ${r}`), ...noAttemptRecord.map(r => `reread ${r} | no reading recorded`), ...pending.map(p => `${p.startsWith('assessed, not imported') ? 'import' : /^(no state|unknown state|unreadable ledger)/.test(p) ? 'repair' : 'decide'} ${p}`)];
  const report = {
    runId, finishedAt: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    searchCoverage: retry.length ? 'partial' : 'complete',
    import: {added: added.length, addedBySource},
    ledger: {finds: ledger.length, ...count(ledger, r => String(r.state || 'no state').toLowerCase())},
    reads: {attempts: reads.length, candidates: candidates.size, byLead: reads.filter(r => r.by === 'lead').length, ...count(reads, r => r.text || 'unlabelled'), closed: reads.filter(r => String(r.closure || '').trim()).length, postingReviewed: reviewed.length, ratedWithoutFull, noAttemptRecord},
    linkFinder: {sent: links.length, found: links.length - notFound.length, notFound: notFound.length, notFoundWithoutReason: notFound.filter(l => !String(l.error || '').trim()).length},
    refreshes: {done: refreshRows.length, confirmed: refreshRows.length - unconfirmed.length - unknownIds.length, unconfirmed, unknownIds},
    // Sources left partial or failed without an observed error: the lead retries each once before the summary.
    withoutError: notChecked.filter(isSource).filter(e => !String(e.error || '').trim()).map(line),
    sources, evidence: [...evidence.values()], retry, diagnostics,
  };
  writeJson(path.join(folder, 'finish.json'), report);
  report.dropped = recordDropped(root, [ledgerFile], today);
  return report;
}

const keyOf = item => { const m = String(item).match(/^(employer|portal) (.+?): /); return m ? `${m[1]}|${m[2]}` : null; };
const optionalJson = file => { try { return readJson(file); } catch { return null; } };
// A finish record counts only when it is complete enough to trust; anything less is unknown evidence, not success.
const validFinish = (folder, runId) => { const f = optionalJson(path.join(folder, 'finish.json')); return f && f.runId === runId && ['complete', 'partial'].includes(f.searchCoverage) && Array.isArray(f.retry) ? f : null; };

// The retry list to carry into run `runId` (omitted: into the next run). It starts from the newest earlier run with a valid
// finish.json and adds the due sources of later folders without one (interrupted or taken-over runs). A source counts as
// done only when checked in the latest run that selected it or later. A completed setup reset after an item's run drops
// it when that reset replayed all sources or that employer. Runs are ordered by run-completion.json startedAt; names
// (whose random suffix is not chronological) only order folders without one, and at equal start times an unfinished
// folder counts as later. Folders without due.json, such as a title triage, add nothing.
export function previousRetry(root, runId) {
  const runs = path.join(root, 'reports', 'runs');
  const info = name => { const folder = path.join(runs, name), t = Date.parse(optionalJson(path.join(folder, 'run-completion.json'))?.startedAt); return {name, folder, start: Number.isFinite(t) ? t : null, finish: validFinish(folder, name)}; };
  const order = (a, b) => a.start !== null && b.start !== null && a.start !== b.start ? a.start - b.start
    : a.start !== null && b.start !== null && !!a.finish !== !!b.finish ? (a.finish ? -1 : 1) : a.name < b.name ? -1 : a.name > b.name ? 1 : 0;
  const target = runId ? {...info(runId), finish: null} : null;
  const all = fs.existsSync(runs) ? fs.readdirSync(runs).filter(n => n !== runId && fs.statSync(path.join(runs, n)).isDirectory()).map(info) : [];
  const earlier = all.filter(r => !target || order(r, target) < 0).sort(order);
  const fromIndex = earlier.findLastIndex(r => r.finish), from = earlier[fromIndex] || null;
  const owed = new Map(), outcome = new Map(), at = e => Date.parse(e.at) || 0;
  for (const item of from ? from.finish.retry : []) owed.set(keyOf(item) || item, {item, index: fromIndex});
  earlier.forEach((r, index) => {
    if (index <= fromIndex || r.finish) return;
    // shortcut: undated lines sort first within their run instead of finishRun's conflict handling; legacy runs only.
    for (const e of filesOf(r.folder, /^(source-evidence|evidence-.*)\.jsonl$/).flatMap(rowsOf).sort((a, b) => at(a) - at(b))) outcome.set(`${e.kind}|${e.source}`, {status: e.status, index});
    for (const file of ['due.json', 'due-selection.json'].map(f => path.join(r.folder, f)).filter(fs.existsSync)) {
      const d = optionalJson(file) || {};  // due-selection.json: the earlier helper's journal, {sources: [{kind, source}]}
      for (const [kind, source] of Array.isArray(d.sources) ? d.sources.map(s => [s.kind, s.source]) : Object.entries(d).flatMap(([k, list]) => Array.isArray(list) ? list.map(s => [k, s]) : [])) {
        const key = `${kind}|${source}`;
        owed.set(key, {item: owed.get(key)?.item || `${kind} ${source}: not checked in unfinished run ${r.name}`, index});
      }
    }
  });
  const reports = path.join(root, 'reports'), backups = path.join(reports, 'setup-backups');
  const resets = [path.join(reports, 'setup-scope-reset.json'), ...(fs.existsSync(backups) ? filesOf(backups, /^scope-\d.*\.json$/) : [])]
    .map(optionalJson).filter(r => r?.status === 'complete' && Number.isFinite(Date.parse(r.completedAt)));
  const replayed = (key, start) => start !== null && resets.some(r => Date.parse(r.completedAt) > start && (!target?.start || Date.parse(r.completedAt) < target.start)
    && (r.mode !== 'employers' ? /^(employer|portal)\|/.test(key) : key.startsWith('employer|') && (r.employers || []).includes(key.slice('employer|'.length))));
  const retry = [];
  for (const [key, {item, index}] of owed) {
    if (!keyOf(item)) { retry.push(item); continue; }
    const o = outcome.get(key);
    if (o?.status === 'checked' && o.index >= index) continue;
    if (replayed(key, earlier[index]?.start ?? null)) continue;
    retry.push(o && o.index >= index && !item.includes(': ' + o.status) ? `${key.replace('|', ' ')}: ${o.status} in unfinished run ${earlier[o.index].name}` : item);
  }
  return {from: from?.name || null, retry};
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), option = name => { const i = args.indexOf(name); return i < 0 ? null : args.splice(i, 2)[1]; };
  const root = path.resolve('data'), today = option('--today') || undefined, retryFor = option('--retry-for');
  // A wrong ROOT or a missing mount would hide the run folder: refuse instead.
  if (!fs.existsSync(path.join(root, 'jobs.json'))) { console.error(`jobs.json not found in ${root}: run from the verified ROOT`); process.exit(2); }
  // --retry-for <run-id>: print the retry list this run must carry (Setup), one item per line, after a FROM line.
  if (retryFor) { const {from, retry} = previousRetry(root, retryFor); console.log(`FROM ${from || 'none'}`); for (const item of retry) console.log(item); process.exit(0); }
  if (args.length !== 1 || args[0].startsWith('--')) { console.error('Usage: node app/finish-run.mjs [--today YYYY-MM-DD] <run-id> | --retry-for <run-id>'); process.exit(1); }
  if (!fs.existsSync(path.join(root, 'reports', 'coverage.json'))) { console.error(`coverage.json not found in ${root}/reports: write it before finishing`); process.exit(2); }
  try {
    const r = finishRun(root, args[0], today);
    console.log(`RESULT ${JSON.stringify({searchCoverage: r.searchCoverage, added: r.import.added, retry: r.retry.length, ratedWithoutFull: r.reads.ratedWithoutFull.length, noAttemptRecord: r.reads.noAttemptRecord.length, refreshUnconfirmed: r.refreshes.unconfirmed.length, withoutError: r.withoutError.length, dropped: r.dropped})}`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
