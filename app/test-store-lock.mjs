// withLock: a failure after the lock file was created (writing the owner token) must fail at once and free the lock,
// not be retried as contention until it surfaces as BusyError (Codex, 24 Nov).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {open} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {withLock} from './store.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'store-lock-'));
const lock = path.join(root, 'jobs.json.lock');
const failing = async (file, flags) => {
  const h = await open(file, flags);
  return {writeFile: async () => { throw Object.assign(new Error('EPERM: simulated token write'), {code: 'EPERM'}); }, close: () => h.close()};
};
for (const noDelete of [false, true]) {
  const started = Date.now();
  await assert.rejects(withLock(root, async () => 'never', {openLock: failing, timeoutMs: 2000, noDelete}), {code: 'EPERM'});
  assert.ok(Date.now() - started < 1000, 'failed at once, not after the timeout');
  assert.equal(fs.existsSync(lock), false, 'lock freed');
  // The next writer gets the lock.
  assert.equal(await withLock(root, async () => 'ok', {timeoutMs: 2000}), 'ok');
  assert.equal(fs.existsSync(lock), false);
}
fs.rmSync(root, {recursive: true, force: true, maxRetries: 5});
console.log('store lock tests passed');
