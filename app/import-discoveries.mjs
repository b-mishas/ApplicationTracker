// Daily discovery importer. Usage:
//   node import-discoveries.mjs incoming/2026-11-03-<runId>.json [--dry-run] [--validate-only] [--root DIR] [--lock-timeout-ms N]
//   node import-discoveries.mjs --delete-ids <id,id,...> [--dry-run] [--root DIR]   (removes duplicate records that hold no user data)
// Exit codes: 0 success, 2 invalid envelope/all records rejected, 3 locked/conflict,
// 4 write/data failure, 5 valid records processed but some records rejected.
// The last stdout line is "RESULT {json}" with counts and the report path.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import crypto from 'node:crypto';
import {commit, readState, writeJsonAtomic, ConflictError, BusyError, DataError} from './store.mjs';
import {validate} from './jsonschema.mjs';
import {dataRoot} from './config.mjs';
import {isCountryCode,calendarDate} from './settings.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const schema = JSON.parse(await readFile(path.join(here, 'batch.schema.json'), 'utf8'));

// ---------- normalisation ----------
const fold = s => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase();
const alnum = s => fold(s).replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '');
export const normCompany = s => alnum(String(s).replace(/\b(gmbh|ag|se|kg|inc|ltd|limited|bv|nv|sa|sl|plc|co|llc|the)\b\.?/gi, ''));
export const normTitle = s => alnum(String(s).replace(/\((?:[^)]*\b(?:m\s*[\/|]\s*[wfd]|w\s*[\/|]\s*[mfd]|f\s*[\/|]\s*[mwd]|d\s*[\/|]\s*[mwf]|x|all\s+genders?|gn|mwd|fmd)\b[^)]*)\)/gi, ' '));
const normCity = s => alnum(s);
const TRACKING = /^(utm_.*|gclid|fbclid|trk|trkinfo|trackingid|refid|ref|referrer|from|src|vjs|vjk|tk|campaignid|mkt_tok|_ga|_gl)$/i;
export function urlIdentity(raw) {
  let u; try { u = new URL(raw); } catch { return null; }
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (host.endsWith('linkedin.com')) {
    const m = u.pathname.match(/\/jobs\/view\/(?:[^/]*-)?(\d{6,})/) || [null, u.searchParams.get('currentJobId')];
    if (m[1]) return {key: 'pid:linkedin:' + m[1], provider: 'linkedin', id: m[1]};
  }
  if (host.endsWith('indeed.com')) { const jk = u.searchParams.get('jk') || u.searchParams.get('vjk'); if (jk) return {key: 'pid:indeed:' + jk.toLowerCase(), provider: 'indeed', id: jk.toLowerCase()}; }
  const params = [...u.searchParams].filter(([k]) => !TRACKING.test(k)).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('&');
  return {key: `url:${host}${u.pathname.replace(/\/+$/, '')}${params ? '?' + params : ''}`};
}
const providerKey = (p, id) => p && id ? `pid:${alnum(p)}:${String(id).toLowerCase()}` : null;
export function strongKeys(job) {
  const keys = new Set(), ids = new Map();
  const pk = providerKey(job.provider, job.providerJobId); if (pk) { keys.add(pk); ids.set(alnum(job.provider), String(job.providerJobId).toLowerCase()); }
  for (const other of job.otherIds || []) keys.add('pid:' + other.toLowerCase());
  const urls = [];
  if (job.linkType === 'posting') urls.push(job.url);
  urls.push(...(job.postingUrls || []));
  for (const u of urls) { const id = urlIdentity(u); if (id) { keys.add(id.key); if (id.provider) ids.set(id.provider, id.id); } }
  return {keys, ids};
}

// ---------- validation ----------
export function inspectBatch(batch, batchName) {
  // Validate the envelope without descending into individual records first.
  const envelope = {...schema, properties: {...schema.properties, jobs: {...schema.properties.jobs, items: undefined}}};
  const errors = validate(envelope, batch);
  if (errors.length) return {errors, accepted: [], rejected: []};
  const m = batchName.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.json$/);
  if (!m) errors.push(`file name "${batchName}" must be YYYY-MM-DD-<runId>.json`);
  else if (m[2] !== batch.runId) errors.push(`file name run id "${m[2]}" must equal runId "${batch.runId}"`);
  if (errors.length) return {errors, accepted: [], rejected: []};
  const accepted = [], rejected = [];
  batch.jobs.forEach((j, i) => {
    const at = `$.jobs[${i}]`;
    const issues = validate(schema.$defs.job, j, schema, at);
    // Run cross-field checks only after structure validation, including null records.
    if (!issues.length) {
      for(const country of j.countries)if(!isCountryCode(country))issues.push(at+'.countries: unsupported country code '+country);
      j.sources.forEach((s, k) => { if (s.file !== batchName) issues.push(`${at}.sources[${k}].file must be "${batchName}" (the batch file name), got "${s.file}"`); });
      if (j.availability !== 'Unverified' && (j.assessmentBasis !== 'Posting reviewed' || j.linkType !== 'posting')) issues.push(`${at}: availability ${j.availability} requires assessmentBasis "Posting reviewed" and linkType "posting"`);
      if (!!j.provider !== !!j.providerJobId) issues.push(`${at}: provider and providerJobId must be given together`);
      if (j.linkType === 'search' && j.availability !== 'Unverified') issues.push(`${at}: a search link cannot verify availability`);
    }
    if (issues.length) rejected.push({index: i, company: j?.company, title: j?.title, outcome: 'rejected', errors: issues});
    else accepted.push({index: i, job: j});
  });
  return {errors, accepted, rejected};
}
// Keep the flat validation helper useful to callers requiring a strict validity check.
export function validateBatch(batch, batchName) {
  const result = inspectBatch(batch, batchName);
  return [...result.errors, ...result.rejected.flatMap(r => r.errors)];
}

// ---------- merge ----------
const rank = b => b === 'Posting reviewed' ? 2 : 1;
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const srcKey = s => [s.label, s.url, s.file].map(x => String(x).toLowerCase()).join('|');
const countryText = c => c.join(', ');
const locCompatible = (rec, j) => {
  const a = rec.countries || [], b = j.countries || [];
  if (a.length && b.length && !a.some(c => b.includes(c))) return 'no';
  const rc = normCity(rec.city), jc = normCity(j.city);
  if (rc && jc) return rc === jc ? 'yes' : 'no';
  if (!a.length || !b.length) return 'unknown';
  return a.some(c => b.includes(c)) ? 'yes' : 'no';
};

function newRecord(j, ctx) {
  const day = calendarDate(j.observedAt);
  const r = {
    id: crypto.randomUUID(), fit: j.fit, company: j.company, title: j.title, group: j.group, countries: [...j.countries], country: countryText(j.countries),
    city: j.city, locationRaw: j.locationRaw, workMode: j.workMode, workModeRaw: j.workModeRaw, seniority: j.seniority, postedDate: j.postedDate,
    firstSeen: day, lastSeen: day, assessmentBasis: j.assessmentBasis, availability: j.availability, url: j.url, linkType: j.linkType,
    reasoning: j.reasoning, gaps: j.gaps, status: 'New', notes: '', sources: dedupeSources(j.sources),
    lastObservedAt: j.observedAt, assessedAt: j.observedAt, updatedAt: ctx.now,
    workModeBasis: j.assessmentBasis, workModeAt: j.observedAt
  };
  if (j.provider) { r.provider = j.provider; r.providerJobId = j.providerJobId; }
  if (j.availability !== 'Unverified') r.availabilityAt = j.observedAt;
  return r;
}
const dedupeSources = list => { const seen = new Set(), out = []; for (const s of list) { const k = srcKey(s); if (!seen.has(k)) { seen.add(k); out.push({...s}); } } return out; };

function mergeInto(rec, j, ctx) {
  const before = JSON.stringify(rec), original = JSON.parse(before), changed = new Set();
  const set = (k, v) => { if (!same(rec[k], v)) { rec[k] = v; changed.add(k); } };
  const day = calendarDate(j.observedAt);
  // dates owned by the importer, derived from observation dates
  if (!rec.firstSeen) set('firstSeen', day);
  const last = [rec.lastSeen || rec.firstSeen, day].filter(Boolean).sort().pop(); set('lastSeen', last);
  const prevObs = rec.lastObservedAt || '';
  const newer = j.observedAt >= prevObs;
  if (newer) set('lastObservedAt', j.observedAt);
  // assessment: never downgrade evidence; null never erases a fit
  const exRank = rank(rec.assessmentBasis), inRank = rank(j.assessmentBasis);
  const assessedAt = rec.assessedAt || '';
  if (inRank > exRank || (inRank === exRank && j.observedAt >= assessedAt)) {
    if (j.fit !== null || rec.fit == null) set('fit', j.fit);
    for (const k of ['reasoning', 'gaps', 'seniority']) if (j[k] || !rec[k]) set(k, j[k]);
    set('assessmentBasis', j.assessmentBasis); set('assessedAt', j.observedAt);
  } else if (rec.fit == null && j.fit !== null && inRank === exRank) { set('fit', j.fit); }
  // availability: only evidence-backed observations, newest wins; Unverified never overrides
  if (j.availability !== 'Unverified' && j.observedAt >= (rec.availabilityAt || '')) { set('availability', j.availability); set('availabilityAt', j.observedAt); }
  // Work arrangement and geographic restrictions form one evidence-backed unit.
  // Capture the old basis before relying on the assessment updated above.
  const workRank = rank(rec.workModeBasis || original.assessmentBasis);
  const workAt = rec.workModeAt || original.assessedAt || original.lastObservedAt || '';
  if (j.workMode !== 'Unknown' && (inRank > workRank || (inRank === workRank && j.observedAt >= workAt))) {
    // A blank restriction must not erase known eligibility for the same mode.
    // If the mode changes but restrictions are absent, keep the whole old unit.
    if (j.workModeRaw || !rec.workModeRaw) {
      set('workMode', j.workMode); set('workModeRaw', j.workModeRaw);
      set('workModeBasis', j.assessmentBasis); set('workModeAt', j.observedAt);
    }
  }
  if (j.postedDate && (!rec.postedDate || (!/^\d{4}-\d{2}-\d{2}/.test(rec.postedDate) && /^\d{4}-\d{2}-\d{2}/.test(j.postedDate)))) set('postedDate', j.postedDate);
  // fill-only descriptive fields (original full location text is kept)
  if (!rec.group && j.group) set('group', j.group);
  if (!rec.city && j.city) set('city', j.city);
  if (!rec.locationRaw && j.locationRaw) set('locationRaw', j.locationRaw);
  if (!(rec.countries || []).length && j.countries.length) { set('countries', [...j.countries]); set('country', countryText(j.countries)); }
  // link: upgrade a search link to a direct posting; keep a differing posting URL as an alias
  if (j.linkType === 'posting') {
    if (rec.linkType !== 'posting') { set('url', j.url); set('linkType', 'posting'); }
    else if (strongKeys({url: rec.url, linkType: 'posting'}).keys.has([...strongKeys(j).keys][0] ?? '') === false) {
      const have = new Set([rec.url, ...(rec.postingUrls || [])].map(u => urlIdentity(u)?.key));
      if (!have.has(urlIdentity(j.url)?.key)) set('postingUrls', [...(rec.postingUrls || []), j.url]);
    }
  }
  if (j.provider && !rec.provider) { set('provider', j.provider); set('providerJobId', j.providerJobId); }
  else if (j.provider && providerKey(j.provider, j.providerJobId) !== providerKey(rec.provider, rec.providerJobId)) {
    const k = providerKey(j.provider, j.providerJobId).slice(4);
    if (!(rec.otherIds || []).includes(k)) set('otherIds', [...(rec.otherIds || []), k]);
  }
  // sources
  const merged = dedupeSources([...(rec.sources || []), ...j.sources]);
  if (merged.length !== (rec.sources || []).length) set('sources', merged);
  if (j.title !== rec.title && normTitle(j.title) !== normTitle(rec.title)) { const alt = rec.alternateTitles || []; if (!alt.includes(j.title)) set('alternateTitles', [...alt, j.title]); }
  if (before !== JSON.stringify(rec)) rec.updatedAt = ctx.now;
  return [...changed];
}

// A discovery that names an existing record (matchesRecordId) updates exactly that record, including renamed title and relocated city.
// id, status, notes, firstSeen and unknown user fields stay; the assessment still follows the never-downgrade rule of mergeInto.
function mergeById(rec, j, ctx) {
  const oldTitle = rec.title, oldUrl = rec.url, oldLink = rec.linkType;
  const changed = new Set(mergeInto(rec, j, ctx));
  const set = (k, v) => { if (!same(rec[k], v)) { rec[k] = v; changed.add(k); } };
  if (oldTitle && oldTitle !== j.title) { const alt = rec.alternateTitles || []; if (!alt.includes(oldTitle)) set('alternateTitles', [...alt, oldTitle]); }
  set('title', j.title); set('city', j.city); set('locationRaw', j.locationRaw);
  set('countries', [...j.countries]); set('country', countryText(j.countries));
  if (j.group) set('group', j.group);
  if (j.workMode !== 'Unknown') { set('workMode', j.workMode); set('workModeRaw', j.workModeRaw); }
  if (j.postedDate) set('postedDate', j.postedDate);
  if (j.availability !== 'Unverified') { set('availability', j.availability); set('availabilityAt', j.observedAt); }
  if (j.linkType === 'posting' || oldLink !== 'posting') {
    if (oldLink === 'posting' && oldUrl && oldUrl !== j.url && urlIdentity(oldUrl)?.key !== urlIdentity(j.url)?.key) set('postingUrls', [...new Set([...(rec.postingUrls || []), oldUrl])]);
    set('url', j.url); set('linkType', j.linkType);
  }
  if (j.provider) { set('provider', j.provider); set('providerJobId', j.providerJobId); }
  if (changed.size) rec.updatedAt = ctx.now;
  return [...changed];
}

export function mergeBatch(data, batch, ctx) {
  const outcomes = [], c = {added: 0, updated: 0, unchanged: 0, ambiguous: 0, rejected: 0, merged: 0};
  batch.jobs.forEach((j, index) => {
    const label = {index: ctx.originalIndices?.[index] ?? index, company: j.company, title: j.title, url: j.url};
    if (j.matchesRecordId) {
      const rec = data.jobs.find(r => r.id === j.matchesRecordId);
      if (!rec) { c.rejected++; outcomes.push({...label, outcome: 'rejected', errors: [`matchesRecordId "${j.matchesRecordId}" does not exist in jobs.json`]}); return; }
      const fields = mergeById(rec, j, ctx);
      c.merged++;
      if (fields.length) { c.updated++; outcomes.push({...label, outcome: 'updated', mergedById: true, id: rec.id, changedFields: fields}); }
      else { c.unchanged++; outcomes.push({...label, outcome: 'unchanged', mergedById: true, id: rec.id}); }
      return;
    }
    const jKeys = strongKeys(j);
    const hits = new Set();
    data.jobs.forEach((rec, i) => { const rk = strongKeys(rec).keys; for (const k of jKeys.keys) if (rk.has(k)) { hits.add(i); break; } });
    let target = null, reason = '';
    if (hits.size > 1) reason = 'identity matches more than one existing record';
    else if (hits.size === 1) {
      const rec = data.jobs[[...hits][0]];
      const rIds = strongKeys(rec).ids, clash = [...jKeys.ids].some(([p, id]) => rIds.has(p) && rIds.get(p) !== id);
      const co = normCompany(rec.company), cj = normCompany(j.company);
      if (clash) reason = 'same posting URL but a different provider job id';
      else if (co !== cj && !co.includes(cj) && !cj.includes(co)) reason = `identity matches "${rec.company}" but the discovery names "${j.company}"`;
      else target = rec;
    } else {
      const cands = data.jobs.filter(rec => normCompany(rec.company) === normCompany(j.company) && normTitle(rec.title) === normTitle(j.title)
        && !(jKeys.keys.size && strongKeys(rec).keys.size && [...jKeys.ids].some(([p, id]) => strongKeys(rec).ids.has(p) && strongKeys(rec).ids.get(p) !== id)));
      const compat = cands.filter(rec => locCompatible(rec, j) === 'yes'), unknown = cands.filter(rec => locCompatible(rec, j) === 'unknown');
      if (compat.length === 1 && !unknown.length) {
        const candidate = compat[0];
        // Distinct known posting identities need positive evidence of equivalence.
        if (jKeys.keys.size && strongKeys(candidate).keys.size) reason = 'company/title/location match but direct posting identities differ';
        else target = candidate;
      }
      else if (compat.length + unknown.length > 1 || unknown.length) reason = 'company and title match but the location is unknown or several records fit';
      else if (compat.length > 1) reason = 'company, title and location match several records';
      if (reason) { label.candidates = [...compat, ...unknown].map(r => ({id: r.id, city: r.city, countries: r.countries})); }
    }
    if (reason) { c.ambiguous++; outcomes.push({...label, outcome: 'ambiguous', reason, candidates: label.candidates || [...hits].map(i => ({id: data.jobs[i].id, company: data.jobs[i].company, title: data.jobs[i].title}))}); return; }
    if (!target) { const rec = newRecord(j, ctx); data.jobs.push(rec); c.added++; outcomes.push({...label, outcome: 'added', id: rec.id}); return; }
    const fields = mergeInto(target, j, ctx);
    if (fields.length) { c.updated++; outcomes.push({...label, outcome: 'updated', id: target.id, changedFields: fields}); }
    else { c.unchanged++; outcomes.push({...label, outcome: 'unchanged', id: target.id}); }
  });
  return {counts: c, outcomes};
}

// ---------- orchestration ----------
export async function importBatch({root = dataRoot, batchPath, dryRun = false, validateOnly = false, lock, beforeRename, now = () => new Date().toISOString()}) {
  const file = path.resolve(root, batchPath), name = path.basename(file), base = {batch: name, dryRun, rejected: 0, added: 0, updated: 0, unchanged: 0, ambiguous: 0};
  const reportPath = path.join(root, 'reports', name.replace(/\.json$/i, '') + '.report.json');
  const fail = async (code, kind, errors, extra = {}) => {
    const rep = {...base, status: kind, exitCode: code, errors, importedAt: now(), ...extra};
    // Failure reports get their own file so they can never overwrite the report of a successful import of the same batch.
    const failPath = reportPath.replace(/\.report\.json$/, `.failed-${Date.now()}.report.json`);
    if(!validateOnly){try { await writeJsonAtomic(failPath, rep); } catch { /* report is best effort for failures */ }}
    return {...rep, report: validateOnly?null:path.relative(root, failPath)};
  };
  let text;
  try { text = await readFile(file, 'utf8'); } catch (e) { return fail(2, 'rejected', [`Cannot read batch file: ${e.message}`]); }
  let batch;
  try { batch = JSON.parse(text.replace(/^﻿/, '')); } catch (e) { return fail(2, 'rejected', [`Malformed JSON: ${e.message}`], {sha256: crypto.createHash('sha256').update(text).digest('hex')}); }
  const validation = inspectBatch(batch, name);
  const sha256 = crypto.createHash('sha256').update(text).digest('hex'), total = Array.isArray(batch?.jobs) ? batch.jobs.length : 0;
  if (validation.errors.length) return fail(2, 'rejected', validation.errors.slice(0, 50), {sha256, rejected: total});
  const rejected = validation.rejected.length;
  const recordErrors = validation.rejected.flatMap(r => r.errors);
  if (total && !validation.accepted.length) return fail(2, 'rejected', recordErrors, {sha256, rejected, outcomes: validation.rejected});
  if (validateOnly) return {...base, status: rejected ? 'partially-valid' : 'valid', exitCode: rejected ? 5 : 0, sha256, jobs: total, accepted: validation.accepted.length, rejected, errors: recordErrors, outcomes: validation.rejected};
  const ctx = {now: now(), originalIndices: validation.accepted.map(r => r.index)};
  const validBatch = {...batch, jobs: validation.accepted.map(r => r.job)};
  try {
    const result = await commit(root, data => { const r = mergeBatch(data, validBatch, ctx); return {...r, skipWrite: dryRun || (r.counts.added + r.counts.updated === 0)}; }, {lock, beforeRename, tag: 'jobs-import'});
    const mergeRejected = result.outcomes.filter(o => o.outcome === 'rejected'), rejectedAll = rejected + mergeRejected.length;
    const allErrors = [...recordErrors, ...mergeRejected.flatMap(o => o.errors)];
    const status = dryRun ? (rejectedAll ? 'dry-run-partial' : 'dry-run') : (rejectedAll ? 'partial' : 'imported');
    const rep = {...base, status, exitCode: rejectedAll ? 5 : 0, ...result.counts, rejected: rejectedAll, errors: allErrors, sha256, runId: batch.runId, searchedAt: batch.searchedAt, importedAt: ctx.now, written: result.written, backup: result.backup || null, revision: result.revision, outcomes: [...result.outcomes, ...validation.rejected].sort((a,b) => a.index-b.index), mergedById: result.outcomes.filter(o => o.mergedById).map(o => ({index: o.index, id: o.id, outcome: o.outcome}))};
    if (!dryRun) { try { await writeJsonAtomic(reportPath, rep); } catch (e) { rep.reportError = e.message; } }
    return {...rep, report: dryRun ? null : path.relative(root, reportPath)};
  } catch (e) {
    const code = e instanceof BusyError || e instanceof ConflictError ? 3 : 4;
    return fail(code, code === 3 ? 'locked' : 'failed', [e.message, ...recordErrors], {sha256, rejected, outcomes: validation.rejected, note: 'jobs.json was not changed by this attempt.'});
  }
}

// ---------- delete duplicates ----------
// Removes records by id under the shared lock with a backup. Only records that carry no user work (status New or Dismissed, empty notes, no application date) can be removed.
export async function deleteRecords({root = dataRoot, ids, dryRun = false, lock, now = () => new Date().toISOString()}) {
  const wanted = [...new Set(ids)];
  if (!wanted.length) return {status: 'rejected', exitCode: 2, errors: ['No ids given']};
  try {
    const result = await commit(root, data => {
      const errors = [], removed = [];
      for (const id of wanted) {
        const rec = data.jobs.find(r => r.id === id);
        if (!rec) { errors.push(`${id}: no such record`); continue; }
        if (!['New', 'Dismissed'].includes(rec.status) || rec.notes || rec.applicationDate || rec.statusHistory?.length || Object.hasOwn(rec,'interviewDate') || rec.interviewOutcome || rec.interviewOutcomeDate || rec.offerDate) errors.push(`${id} (${rec.company} | ${rec.title}): has user data (status ${rec.status}, notes, application or milestone dates, or status history); not deleted`);
        else removed.push({id, company: rec.company, title: rec.title, city: rec.city, status: rec.status});
      }
      if (errors.length) throw new DataError(errors.join('; '));
      data.jobs = data.jobs.filter(r => !removed.some(x => x.id === r.id));
      return {removed, skipWrite: dryRun};
    }, {lock, tag: 'jobs-delete'});
    const rep = {status: dryRun ? 'dry-run' : 'deleted', exitCode: 0, removed: result.removed, written: result.written, backup: result.backup || null, importedAt: now()};
    if (!dryRun) { try { await writeJsonAtomic(path.join(root, 'reports', `delete-${Date.now()}.report.json`), rep); } catch (e) { rep.reportError = e.message; } }
    return rep;
  } catch (e) {
    return {status: e instanceof DataError ? 'rejected' : e instanceof BusyError || e instanceof ConflictError ? 'locked' : 'failed', exitCode: e instanceof DataError ? 2 : e instanceof BusyError || e instanceof ConflictError ? 3 : 4, errors: [e.message], note: 'jobs.json was not changed.'};
  }
}

// ---------- CLI ----------
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  if (args.includes('--delete-ids')) {
    const ids = String(opt('--delete-ids') || '').split(',').map(x => x.trim()).filter(Boolean);
    const res = await deleteRecords({root: opt('--root') ? path.resolve(opt('--root')) : dataRoot, ids, dryRun: args.includes('--dry-run')});
    for (const e of res.errors || []) console.error('ERROR: ' + e);
    console.log(`${res.status.toUpperCase()}: removed ${res.removed?.length ?? 0}`); console.log('RESULT ' + JSON.stringify(res));
    process.exit(res.exitCode ?? 0);
  }
  const batchPath = args.find((a, i) => !a.startsWith('--') && !['--root', '--lock-timeout-ms'].includes(args[i - 1]));
  if (!batchPath) { console.error('Usage: node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json [--dry-run] [--validate-only] [--root DIR] [--lock-timeout-ms N]'); process.exit(2); }
  const res = await importBatch({root: opt('--root') ? path.resolve(opt('--root')) : dataRoot, batchPath, dryRun: args.includes('--dry-run'), validateOnly: args.includes('--validate-only'), lock: opt('--lock-timeout-ms') ? {timeoutMs: Number(opt('--lock-timeout-ms'))} : undefined});
  const {outcomes, ...summary} = res;
  if (res.errors) for (const e of res.errors) console.error('ERROR: ' + e);
  for (const o of outcomes || []) if (o.outcome === 'ambiguous') console.log(`AMBIGUOUS #${o.index} ${o.company} | ${o.title}: ${o.reason}`);
  console.log(`${res.status.toUpperCase()}: added ${res.added}, updated ${res.updated}, unchanged ${res.unchanged}, ambiguous ${res.ambiguous}, rejected ${res.rejected}`);
  console.log('RESULT ' + JSON.stringify({...summary, outcomes: (outcomes || []).filter(o => o.outcome !== 'unchanged').slice(0, 100)}));
  process.exit(res.exitCode ?? 0);
}
