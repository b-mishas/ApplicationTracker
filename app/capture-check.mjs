// Search agent's find check. Writes nothing; the agent keeps its own run ledger (agent/ROUTINE_PROMPT.md).
//   node app/capture-check.mjs <file> [<file> ...]   one known | similar | new line per find, against jobs.json and the coverage.json dropped list
//   node app/capture-check.mjs --open [<run-ledger.jsonl> ...]   current profile hash, then finds still needing work (default: all runs)
// Replaces run-state.mjs (last in commit 92e1d73) after roadmap milestone 12.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {strongKeys, normCompany, normTitle} from './import-discoveries.mjs';

const parse = raw => JSON.parse(raw.replace(/^﻿/, ''));
const optional = file => fs.existsSync(file) ? parse(fs.readFileSync(file, 'utf8')) : {};
// Strong match: same company and a shared provider job ID or posting URL (tracking parameters ignored), including record aliases.
const nameKey = (company, title) => `${normCompany(company)}|${normTitle(title)}`;
const squash = value => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
const findKeys = d => [...strongKeys({provider: d.provider, providerJobId: d.providerJobId, url: d.url, linkType: d.url ? 'posting' : 'search'}).keys];
function matchIndex(entries, label) {
  const strong = new Map(), byName = new Map();
  for (const entry of entries) {
    const hit = label(entry);
    for (const key of strongKeys({...entry, linkType: entry.linkType || 'posting'}).keys) strong.set(key + '@' + normCompany(entry.company), hit);
    const key = nameKey(entry.company, entry.title);
    byName.set(key, [...(byName.get(key) || []), {place: squash([entry.locationRaw, entry.city].join(' ')), hit}]);
  }
  return {strong, byName};
}
const strongMatch = (index, d) => findKeys(d).map(key => index.strong.get(key + '@' + normCompany(d.company))).find(Boolean) || null;
const nameMatch = (index, d) => {
  const location = squash(d.location);
  return (index.byName.get(nameKey(d.company, d.title)) || []).find(({place}) => d.location === 'Unknown' || place && (place.includes(location) || location.includes(place)))?.hit || null;
};

// Accepts JSONL, a JSON array, {candidates: [...]}, or ledger lines whose find sits in `discovery`.
function rowsOf(file) {
  const text = fs.readFileSync(file, 'utf8').replace(/^﻿/, '').trim();
  if (!text) return [];
  let whole; try { whole = JSON.parse(text); } catch { whole = undefined; }
  if (whole !== undefined) return Array.isArray(whole) ? whole : whole?.candidates ?? [whole];
  return text.split(/\r?\n/).flatMap((line, i) => {
    if (!line.trim()) return [];
    try { return [JSON.parse(line)]; } catch { throw new Error(`${file}: line ${i + 1} is not JSON`); }
  });
}
function findOf(row) {
  const item = row?.discovery && typeof row.discovery === 'object' ? row.discovery : row || {};
  const pick = (...keys) => { for (const k of keys) if (item[k] != null && String(item[k]).trim()) return String(item[k]).trim(); };
  const d = {company: pick('company'), title: pick('title', 'advertisedTitle'), location: pick('location', 'locationRaw') || 'Unknown'};
  const url = pick('url', 'postingUrl'); if (url && /^https?:/i.test(url)) d.url = url;
  const id = pick('providerJobId', 'jobId', 'requisitionId'), provider = pick('provider');
  if (id && provider) Object.assign(d, {provider, providerJobId: id});
  return d;
}
const line = d => [d.company, d.title, d.location, d.url].filter(Boolean).join(' | ');
const inventory = root => matchIndex(optional(path.join(root, 'jobs.json')).jobs || [], j => `${j.id} (${j.status})`);

export function check(root, files) {
  const stored = inventory(root);
  const dropped = matchIndex(optional(path.join(root, 'reports', 'coverage.json')).dropped || [], e => `dropped: ${e.reason}`);
  return files.flatMap(rowsOf).map(findOf).map(d => {
    if (!d.company || !d.title) return `invalid | ${JSON.stringify(d)} (needs company and title)`;
    const hit = strongMatch(stored, d) || strongMatch(dropped, d);
    if (hit) return `known | ${d.company} | ${d.title} = ${hit}`;
    const similar = nameMatch(stored, d);
    return similar ? `similar | ${line(d)} ≈ ${similar}` : `new | ${line(d)}`;
  });
}

// Same hash as run-state's profileRevision, so decisions in its old run folders stay comparable.
export const profileHash = root => { const file = path.join(root, '..', 'profile', 'candidate_profile.md'); return fs.existsSync(file) ? createHash('sha256').update(fs.readFileSync(file)).digest('hex') : null; };
// Profile a run decided under: run-completion.json `profile` (plain ledger) or manifest.json `profileRevision` (run-state).
function runProfile(folder) {
  for (const [name, key] of [['run-completion.json', 'profile'], ['manifest.json', 'profileRevision']]) {
    try { const value = parse(fs.readFileSync(path.join(folder, name), 'utf8'))[key]; if (value) return String(value).trim(); } catch { /* missing or unreadable */ }
  }
  return null;
}
// All run ledgers, oldest first; run IDs start with local date and time, so names sort by start.
const allLedgers = root => {
  const runs = path.join(root, 'reports', 'runs');
  return fs.existsSync(runs) ? fs.readdirSync(runs).sort().map(run => path.join(runs, run, 'run-ledger.jsonl')).filter(fs.existsSync) : [];
};
// Identity across runs: any shared provider ID or posting URL (company-qualified), else company, title and location.
const identities = d => { const keys = findKeys(d).map(key => key + '@' + normCompany(d.company)); return keys.length ? keys : ['name:' + nameKey(d.company, d.title) + '|' + squash(d.location)]; };

// Reconciliation: one line per vacancy whose newest ledger entry still needs work. Done = duplicate, excluded under the
// current profile, or assessed and in jobs.json. Anything else, including an unknown state, is listed.
// shortcut: after a profile change every older exclusion is listed as reassess; add a cut-off if that list grows long.
export function open(root, ledgers = allLedgers(root)) {
  const stored = inventory(root), current = profileHash(root), newest = [], byKey = new Map(), lines = [];
  for (const ledger of ledgers) {
    const folder = path.dirname(ledger), run = path.basename(folder), profile = runProfile(folder);
    let rows; try { rows = rowsOf(ledger); } catch (error) { lines.push(`open | unreadable ledger | ${run} | ${error.message}`); continue; }
    for (const row of rows) {
      const d = findOf(row);
      const keys = identities(d), slot = keys.map(key => byKey.get(key)).find(i => i !== undefined) ?? newest.length;
      newest[slot] = {row, d, run, profile: row.assessment?.profileRevision || row.profileRevision || profile};
      for (const key of keys) byKey.set(key, slot);
    }
  }
  for (const {row, d, run, profile} of newest) {
    const state = String(row?.state ?? '').trim().toLowerCase();
    const stale = current && profile !== current;
    let label = null;
    if (!state) label = 'no state';
    else if (state === 'pending') label = 'pending';
    else if (state === 'assessed') label = strongMatch(stored, d) ? null : stale ? 'reassess (assessed under another profile)' : 'assessed, not imported';
    else if (state === 'excluded') label = stale ? 'reassess (excluded under another profile)' : null;
    else if (state !== 'duplicate') label = `unknown state ${JSON.stringify(row.state)}`;
    if (label) lines.push(`open | ${label} | ${run} | ${line(d)}`);
  }
  return [`profile ${current || 'missing'}`, ...(lines.length ? lines : ['open: none'])];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), pending = args[0] === '--open', files = pending ? args.slice(1) : args;
  if (!pending && !files.length) { console.error('Usage: node app/capture-check.mjs <file> [...] | --open [<run-ledger.jsonl> ...]'); process.exit(1); }
  try { console.log((pending ? open : check)(path.resolve('data'), ...(files.length ? [files] : [])).join('\n')); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
