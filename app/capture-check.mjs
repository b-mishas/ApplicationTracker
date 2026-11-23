// Search agent's find check. Writes nothing; the agent keeps its own run ledger (agent/ROUTINE_PROMPT.md).
//   node app/capture-check.mjs [--seen <run-ledger.jsonl>] <file> [<file> ...]   one known | repeat | similar | new line per find,
//     against jobs.json, the coverage.json dropped list, the finds in --seen (this run's ledger) and earlier finds in the same call
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
// Name variants for `similar` only (never `known`): a title may end with its own city ("…, London"), and a company may be
// written with or without trailing words ("LabGenius Therapeutics" / "LabGenius"): the shorter name's whole words must
// start the longer one's (at least 4 characters), so "Roche Diagnostics" matches "Roche" but "Rochester Biotech" does not.
const titleVariants = (title, place) => {
  const city = String(place || '').split(/[,;/(]/)[0].trim(), raw = String(title || '');
  const trimmed = city && raw.toLowerCase().endsWith(', ' + city.toLowerCase()) ? raw.slice(0, -(city.length + 2)) : raw;
  return [...new Set([normTitle(raw), normTitle(trimmed)])];
};
const companyWords = s => String(s || '').toLowerCase().replace(/\b(gmbh|ag|se|kg|inc|ltd|limited|bv|nv|sa|sl|plc|co|llc|the)\b/g, ' ').split(/[^\p{L}\p{N}]+/u).filter(Boolean);
const companyOf = name => ({norm: normCompany(name), words: companyWords(name)});
const sameCompany = (a, b) => {
  if (a.norm === b.norm) return true;
  const [short, long] = a.words.length <= b.words.length ? [a.words, b.words] : [b.words, a.words];
  return short.length > 0 && short.length < long.length && short.join('').length >= 4 && short.every((w, i) => w === long[i]);
};
function addEntry(index, entry, hit) {
  for (const key of strongKeys({...entry, linkType: entry.linkType || 'posting'}).keys) index.strong.set(key + '@' + normCompany(entry.company), hit);
  const item = {company: companyOf(entry.company), place: squash([entry.locationRaw, entry.city].join(' ')), hit};
  for (const title of titleVariants(entry.title, entry.city || entry.locationRaw)) index.byTitle.set(title, [...(index.byTitle.get(title) || []), item]);
}
function matchIndex(entries, label) {
  const index = {strong: new Map(), byTitle: new Map()};
  for (const entry of entries) addEntry(index, entry, label(entry));
  return index;
}
// A find as an index entry (finds carry `location`; records carry locationRaw/city).
const asEntry = d => ({company: d.company, title: d.title, locationRaw: d.location === 'Unknown' ? '' : d.location, url: d.url, provider: d.provider, providerJobId: d.providerJobId, linkType: d.url ? 'posting' : 'search'});
const strongMatch = (index, d) => findKeys(d).map(key => index.strong.get(key + '@' + normCompany(d.company))).find(Boolean) || null;
// Same company and title (variants above); locations must overlap unless either side has none (dropped entries store none).
const nameMatch = (index, d) => {
  const location = squash(d.location), company = companyOf(d.company);
  const items = titleVariants(d.title, d.location).flatMap(title => index.byTitle.get(title) || []);
  return items.find(({company: c, place}) => sameCompany(c, company) && (d.location === 'Unknown' || !place || place.includes(location) || location.includes(place)))?.hit || null;
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

// `seen`: files already captured (this run's ledger). A find sharing an ID or URL with a seen find, or with an earlier
// find in the same call, is `repeat`: the same vacancy from another source, read once.
export function check(root, files, seen = []) {
  const stored = inventory(root);
  const dropped = matchIndex(optional(path.join(root, 'reports', 'coverage.json')).dropped || [], e => `dropped: ${e.reason}`);
  const run = {strong: new Map(), byTitle: new Map()};
  for (const d of seen.flatMap(rowsOf).map(findOf)) if (d.company && d.title) addEntry(run, asEntry(d), `ledger: ${line(d)}`);
  return files.flatMap(rowsOf).map(findOf).map(d => {
    if (!d.company || !d.title) return `invalid | ${JSON.stringify(d)} (needs company and title)`;
    const hit = strongMatch(stored, d) || strongMatch(dropped, d), again = strongMatch(run, d), similar = nameMatch(stored, d) || nameMatch(dropped, d) || nameMatch(run, d);
    const result = hit ? `known | ${d.company} | ${d.title} = ${hit}` : again ? `repeat | ${line(d)} = ${again}` : similar ? `similar | ${line(d)} ≈ ${similar}` : `new | ${line(d)}`;
    addEntry(run, asEntry(d), `this call: ${line(d)}`);
    return result;
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
// A find that gains an ID or URL joins the one earlier entry of its name that had neither; entries with different IDs
// stay separate (same-title second requisitions). A line without ID or URL joins only a single earlier entry that had
// neither; otherwise it is its own entry, so it can never close an identified find (both stay listed until decided).
const strongIds = d => findKeys(d).map(key => key + '@' + normCompany(d.company));
const nameId = d => nameKey(d.company, d.title) + '|' + squash(d.location === 'Unknown' ? '' : d.location);
function slotFor(newest, byKey, byName, d) {
  const keys = strongIds(d), keyless = (byName.get(nameId(d)) || []).filter(s => newest[s].keyless);
  const strong = keys.map(key => byKey.get(key)).find(i => i !== undefined);
  if (strong !== undefined) return strong;
  return keyless.length === 1 ? keyless[0] : newest.length;
}

// Reconciliation: one line per vacancy whose newest ledger entry still needs work. Done = duplicate, excluded under the
// current profile, or assessed and in jobs.json. Anything else, including an unknown state, is listed.
// shortcut: after a profile change every older exclusion is listed as reassess; add a cut-off if that list grows long.
export function open(root, ledgers = allLedgers(root)) {
  const stored = inventory(root), current = profileHash(root), newest = [], byKey = new Map(), byName = new Map(), lines = [];
  for (const ledger of ledgers) {
    const folder = path.dirname(ledger), run = path.basename(folder), profile = runProfile(folder);
    let rows; try { rows = rowsOf(ledger); } catch (error) { lines.push(`open | unreadable ledger | ${run} | ${error.message}`); continue; }
    for (const row of rows) {
      const found = findOf(row), keys = strongIds(found), slot = slotFor(newest, byKey, byName, found), before = newest[slot];
      // Every merge keeps identifiers already known, so an imported vacancy is still recognised.
      const d = {...before?.d, ...found};
      // A duplicate line for a vacancy already in the same ledger is a repeat occurrence, not a decision: it keeps the
      // earlier entry's state (and fills in an ID or URL it lacked). A later run's duplicate decision still closes it.
      const repeat = before && before.run === run && String(row?.state ?? '').trim().toLowerCase() === 'duplicate';
      // All IDs and URLs the vacancy has had, so jobs.json is matched by any of them, not only the newest URL.
      const ids = new Set([...(before?.ids || []), ...keys]);
      newest[slot] = repeat ? {...before, d: {...found, ...before.d}, ids, keyless: before.keyless && !keys.length}
        : {row, d, run, ids, profile: row.assessment?.profileRevision || row.profileRevision || profile, keyless: !keys.length && (before?.keyless ?? true)};
      for (const key of keys) byKey.set(key, slot);
      const named = byName.get(nameId(found)) || []; if (!named.includes(slot)) byName.set(nameId(found), [...named, slot]);
    }
  }
  for (const {row, d, run, ids, profile} of newest) {
    const state = String(row?.state ?? '').trim().toLowerCase();
    const stale = current && profile !== current;
    let label = null;
    if (!state) label = 'no state';
    else if (state === 'pending') label = 'pending';
    else if (state === 'assessed') label = [...ids].some(key => stored.strong.has(key)) ? null : stale ? 'reassess (assessed under another profile)' : 'assessed, not imported';
    else if (state === 'excluded') label = stale ? 'reassess (excluded under another profile)' : null;
    else if (state !== 'duplicate') label = `unknown state ${JSON.stringify(row.state)}`;
    if (label) lines.push(`open | ${label} | ${run} | ${line(d)}`);
  }
  return [`profile ${current || 'missing'}`, ...(lines.length ? lines : ['open: none'])];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), at = args.indexOf('--seen'), seen = at < 0 ? [] : args.splice(at, 2).slice(1);
  const pending = args[0] === '--open', files = pending ? args.slice(1) : args, root = path.resolve('data');
  if ((!pending && !files.length) || (at >= 0 && (pending || !seen[0])) || files.some(f => f.startsWith('--'))) { console.error('Usage: node app/capture-check.mjs [--seen <run-ledger.jsonl>] <file> [...] | --open [<run-ledger.jsonl> ...]'); process.exit(1); }
  // A wrong ROOT or a missing mount would make every find `new` and hide all open work: refuse instead.
  if (!fs.existsSync(path.join(root, 'jobs.json'))) { console.error(`jobs.json not found in ${root}: run from the verified ROOT`); process.exit(2); }
  if (pending && !profileHash(root)) { console.error(`profile not found: ${path.join(root, '..', 'profile', 'candidate_profile.md')}`); process.exit(2); }
  try { console.log((pending ? open(root, ...(files.length ? [files] : [])) : check(root, files, seen.filter(f => fs.existsSync(f)))).join('\n')); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
