// Diagnostics bundle for the package maintainer. Writes one JSON file the user can check and send; it sends nothing.
//   node app/diagnostics.mjs [--runs N]   last N search runs (default 5) and the setup log -> data/exports/diagnostics-<UTC>.json
// Privacy: only statuses, counts, models, times and error messages (URLs, email addresses and file paths masked).
// Never the profile, CV, jobs.json, Gmail content, the ledger's finds, the summary or employer and job names.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const readJson = file => { try { return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, '')); } catch { return null; } };
const lines = file => { try { return fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.trim()).map(l => { try { return JSON.parse(l); } catch { return null; } }); } catch { return []; } };
// shortcut: masks URLs, email addresses and paths only; a company name the agent put into an error text stays. The routine forbids it.
export const mask = value => String(value ?? '').slice(0, 300)
  .replace(/https?:\/\/\S+/gi, '<url>').replace(/\b[\w.+-]+@[\w-]+(\.[\w-]+)+\b/g, '<email>')
  .replace(/[A-Za-z]:\\[^\s"']+|\/(?:Users|home|mnt)\/[^\s"']+/g, '<path>');
const pick = (value, allowed) => typeof value === 'string' && allowed.includes(value.trim().toLowerCase()) ? value.trim().toLowerCase() : value == null ? null : 'other';
const time = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(value) ? value : null;
const tally = (rows, key) => rows.reduce((counts, row) => { const k = String(row?.[key] ?? 'none').trim().toLowerCase() || 'none'; counts[k] = (counts[k] || 0) + 1; return counts; }, {});
const STATES = ['ok', 'failed', 'unavailable'], ITEMS = ['done', 'not due', 'deferred', 'partial', 'failed'];

function runLog(log) {
  if (!log || typeof log !== 'object') return null;
  const models = log.models && typeof log.models === 'object' ? log.models : {};
  return {
    assistant: pick(log.assistant, ['claude', 'codex']),
    models: Object.fromEntries(Object.entries(models).slice(0, 10).map(([k, v]) => [mask(k).slice(0, 40), mask(v).slice(0, 60)])),
    startedAt: time(log.startedAt), endedAt: time(log.endedAt),
    access: Object.fromEntries(['gmail', 'browser', 'subagents'].map(k => [k, pick(log.access?.[k], STATES)])),
    items: Object.fromEntries(['1', '2', '3', '4', '5', '6', '7'].map(k => [k, pick(log.items?.[k], ITEMS)])),
    subagents: (Array.isArray(log.subagents) ? log.subagents : []).slice(0, 20).map(s => ({kind: mask(s?.kind).slice(0, 40), model: mask(s?.model).slice(0, 60), count: Number(s?.count) || 0})),
    errors: (Array.isArray(log.errors) ? log.errors : []).slice(0, 50).map(e => ({step: mask(e?.step).slice(0, 10), kind: mask(e?.kind).slice(0, 20), error: mask(e?.error)})),
  };
}

export function diagnostics(root, runs = 5) {
  const app = path.join(root, '..'), info = readJson(path.join(app, 'BUILD_INFO.json')) || readJson(path.join(app, 'package.json')) || {};
  const setup = readJson(path.join(root, 'reports', 'setup-log.json'));
  const folder = path.join(root, 'reports', 'runs'), reports = path.join(root, 'reports');
  const names = fs.existsSync(folder) ? fs.readdirSync(folder).filter(n => fs.statSync(path.join(folder, n)).isDirectory()).sort().slice(-runs) : [];
  return {
    createdAt: new Date().toISOString(),
    package: {version: info.version || null, builtAt: time(info.builtAt)},
    system: {platform: process.platform, arch: process.arch, node: process.version},
    setup: setup ? {updatedAt: time(setup.updatedAt), assistant: pick(setup.assistant, ['claude', 'codex']),
      steps: (Array.isArray(setup.steps) ? setup.steps : []).slice(0, 20).map(s => ({step: Number(s?.step) || null, status: pick(s?.status, ['done', 'skipped', 'blocked', 'failed']), note: mask(s?.note)}))} : null,
    runs: names.map(run => {
      const dir = path.join(folder, run), completion = readJson(path.join(dir, 'run-completion.json')) || {};
      const report = fs.readdirSync(reports).filter(n => n.endsWith(`-${run}.report.json`)).sort().map(n => readJson(path.join(reports, n))).pop();
      return {
        run, status: mask(completion.status).slice(0, 20) || null, startedAt: time(completion.startedAt),
        log: runLog(readJson(path.join(dir, 'run-log.json'))),
        ledgerStates: tally(lines(path.join(dir, 'run-ledger.jsonl')), 'state'),
        sources: Object.fromEntries(Object.entries(Object.groupBy(lines(path.join(dir, 'source-evidence.jsonl')), r => String(r?.kind ?? 'none').toLowerCase())).map(([k, rows]) => [mask(k).slice(0, 20), tally(rows, 'status')])),
        import: report ? {status: mask(report.status).slice(0, 20), added: report.added ?? null, updated: report.updated ?? null, unchanged: report.unchanged ?? null, ambiguous: report.ambiguous ?? null,
          rejected: Array.isArray(report.rejected) ? report.rejected.length : report.rejected ?? null, errors: (report.errors || []).slice(0, 20).map(e => mask(typeof e === 'string' ? e : e?.message || JSON.stringify(e)))} : null,
        summarySaved: fs.existsSync(path.join(dir, 'summary.md')),
      };
    }),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), at = args.indexOf('--runs'), runs = at < 0 ? 5 : Number(args[at + 1]);
  if (!Number.isInteger(runs) || runs < 1 || args.length !== (at < 0 ? 0 : 2)) { console.error('Usage: node app/diagnostics.mjs [--runs N]'); process.exit(1); }
  const root = fileURLToPath(new URL('../data', import.meta.url));
  if (!fs.existsSync(path.join(root, 'jobs.json'))) { console.error(`jobs.json not found in ${root}`); process.exit(2); }
  const out = path.join(root, 'exports', `diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  fs.mkdirSync(path.dirname(out), {recursive: true});
  fs.writeFileSync(out, JSON.stringify(diagnostics(root, runs), null, 2) + '\n');
  console.log(`Diagnostics saved: ${out}\nIt holds statuses, counts and error messages only, no profile, CV, job list or mail content. Look it over, then send it if you want to.`);
}
