// Shared transactional storage for jobs.json. The server and the discovery importer both write only through commit().
// A lock file serializes writers (also across processes), revisions detect stale readers, every write makes a backup,
// and the file is replaced atomically. Readers never see a partial file.
import {readFile, rename, mkdir, copyFile, open, unlink, readdir} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {ensureGroupColours} from './group-colours.mjs';
import {STATUS_VALUES,validateMilestones} from './status-history.mjs';

export const STATUSES=STATUS_VALUES;
export const revision = s => crypto.createHash('sha256').update(s).digest('hex');
export class ConflictError extends Error { constructor(m) { super(m); this.code = 'CONFLICT'; } }
export class BusyError extends Error { constructor(m) { super(m); this.code = 'BUSY'; } }
export class DataError extends Error { constructor(m) { super(m); this.code = 'DATA'; } }
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function withLock(root, fn, {timeoutMs = 15000, noDelete = false} = {}) {
  const lock = path.join(root, 'jobs.json.lock'), start = Date.now(), token = crypto.randomUUID();
  // Released locks are renamed (deleting is not allowed in scheduled Cowork sessions); purge old ones whenever deletion works.
  for (const f of await readdir(root).catch(() => [])) if (f.startsWith('jobs.json.lock.released-')) await unlink(path.join(root, f)).catch(() => {});
  for (;;) {
    try {
      const h = await open(lock, 'wx');
      try { await h.writeFile(JSON.stringify({token, pid: process.pid, at: new Date().toISOString()})); }
      catch (e) { await unlink(lock).catch(() => {}); throw e; }
      finally { await h.close(); }
      break;
    } catch (e) {
      if (e.code !== 'EEXIST') throw e;
      // Age cannot prove that a writer is dead (especially across mounted filesystems).
      // Never steal locks. Recovery requires stopping all writers and explicit removal.
      if (Date.now() - start > timeoutMs) throw new BusyError('jobs.json is locked. Retry shortly; if the owner crashed, stop all writers before manually removing jobs.json.lock.');
      await sleep(20 + Math.random() * 60);
    }
  }
  try { return await fn(); } finally {
    const owner = await readFile(lock, 'utf8').then(JSON.parse).catch(() => null);
    if (owner?.token === token) {
      // Prefer delete; where deletion is forbidden (mounted folder in a scheduled session) rename instead, which also frees the lock.
      try { if (noDelete) throw new Error('delete forbidden (simulated)'); await unlink(lock); } catch { await rename(lock, `${lock}.released-${token}`); }
    }
  }
}

export function assertValidData(data) {
  if (!data || typeof data !== 'object' || !Array.isArray(data.jobs)) throw new DataError('jobs.json must be an object with a jobs array.');
  const ids = new Set();
  for (const j of data.jobs) {
    if (!j || typeof j.id !== 'string' || !j.id) throw new DataError('A position has no id.');
    if (ids.has(j.id)) throw new DataError(`Duplicate position id ${j.id}.`);
    ids.add(j.id);
    if (!STATUSES.includes(j.status)) throw new DataError(`Position ${j.id} has invalid status ${j.status}.`);
    try{validateMilestones(j);}catch(error){throw new DataError(`Position ${j.id}: ${error.message}`);}
  }
}

export async function readState(root) {
  const raw = (await readFile(path.join(root, 'jobs.json'), 'utf8')).replace(/^﻿/, '');
  return {raw, data: JSON.parse(raw), revision: revision(raw)};
}

async function atomicWrite(file, text, beforeRename) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.tmp`;
  try {
    const h = await open(tmp, 'w');
    try { await h.writeFile(text); await h.sync(); } finally { await h.close(); }
    if (beforeRename) await beforeRename();
    for (let attempt = 0; ; attempt++) {
      try { await rename(tmp, file); return; }
      catch (e) { if (attempt < 20 && ['EPERM', 'EBUSY', 'EACCES'].includes(e.code)) { await sleep(50); continue; } throw e; }
    }
  } catch (e) { await unlink(tmp).catch(() => {}); throw e; }
}

// mutate(data) edits the parsed data in place and may return {skipWrite:true, ...extra}. Returns {...extra, revision, written, backup}.
export async function commit(root, mutate, {expectedRevision, lock, beforeRename, tag = 'jobs'} = {}) {
  return withLock(root, async () => {
    const file = path.join(root, 'jobs.json');
    const {raw, data, revision: current} = await readState(root);
    if (expectedRevision && expectedRevision !== current) throw new ConflictError('The file changed. Reload before saving; copy any unsaved notes first.');
    ensureGroupColours(data);
    const result = (await mutate(data)) || {};
    if (result.skipWrite) return {...result, revision: current, written: false};
    ensureGroupColours(data);
    assertValidData(data);
    const next = JSON.stringify(data, null, 2) + '\n';
    JSON.parse(next);
    await mkdir(path.join(root, 'backups'), {recursive: true});
    const backup = path.join('backups', `${tag}-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.json`);
    await copyFile(file, path.join(root, backup));
    await atomicWrite(file, next, beforeRename);
    return {...result, revision: revision(next), written: true, backup};
  }, lock);
}

export async function writeJsonAtomic(file, value) {
  await mkdir(path.dirname(file), {recursive: true});
  await atomicWrite(file, JSON.stringify(value, null, 2) + '\n');
}
