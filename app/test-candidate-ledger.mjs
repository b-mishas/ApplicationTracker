import assert from 'node:assert/strict';
import {mkdtemp, readFile, readdir, rm, writeFile, mkdir, rmdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {initializeLedger, changeLedger, readLedger} from './candidate-ledger.mjs';

const root = await mkdtemp(path.join(os.tmpdir(), 'candidate-ledger-'));
const run = path.join(root, 'setup-capture');
const cli = fileURLToPath(new URL('./candidate-ledger.mjs', import.meta.url));
const candidate = n => ({company: 'Example', title: `Engineer ${n}`, location: 'Berlin', provider: 'ATS', providerJobId: String(n), url: `https://example.test/jobs/${n}`, source: {label: 'Calibration search', ref: `result:${n}`}});
try {
  await initializeLedger(run);
  await changeLedger(run, 'capture', {candidates: Array.from({length: 7}, (_, i) => candidate(i))});
  let state = await readLedger(run);
  const updates = state.rows.slice(0, 3).map(row => ({id: row.id, state: 'assessed', assessment: {fit: 4, basis: 'Posting reviewed', reasoning: 'Core skills match', gaps: 'Office days unknown', evidence: 'Posting requires Java and SQL; Berlin hybrid; exact source is discovery.url.', profileRevision: 'fixture-profile-v1'}}));
  await changeLedger(run, 'resolve', {revision: state.revision, updates});
  // A fresh process sees four pending candidates, and three reusable assessments remain on disk.
  const fresh = JSON.parse(execFileSync(process.execPath, [cli, 'list', '--run', run], {encoding: 'utf8'}));
  assert.equal(fresh.rows.length, 4);
  assert.equal((await readLedger(run)).rows.filter(row => row.assessment).length, 3);
  await assert.rejects(changeLedger(run, 'resolve', {revision: state.revision, updates}), /revision changed/);

  await changeLedger(run, 'capture', {candidates: [{...candidate(0), source: {label: 'Routine search', ref: 'page1:item0'}}]});
  state = await readLedger(run);
  assert.equal(state.rows.length, 7);
  assert.equal(state.rows[0].state, 'assessed');
  assert.equal(state.rows[0].sources.length, 2);
  // Known different requisition IDs must not collapse even when URL/title are identical.
  await changeLedger(run, 'capture', {candidates: [{...candidate(0), providerJobId: 'different'}]});
  assert.equal((await readLedger(run)).rows.length, 8);

  const sharedUrl = n => ({company: 'Example', title: `Role ${n}`, location: 'Berlin', url: 'https://example.test/search', source: {label: 'Search', ref: `item${n}`}});
  await changeLedger(run, 'capture', {candidates: [sharedUrl(1), sharedUrl(2)]});
  assert.equal((await readLedger(run)).rows.length, 10, 'Shared search URLs must not collapse distinct roles');
  const input = path.join(root, 'capture.json');
  await writeFile(input, '\uFEFF' + JSON.stringify({candidates: [candidate(20)]}));
  const captured = JSON.parse(execFileSync(process.execPath, [cli, 'capture', '--run', run, '--input', input], {encoding: 'utf8'}));
  assert.equal(captured.total, 11);

  const ledger = path.join(run, 'run-ledger.jsonl');
  const before = await readFile(ledger, 'utf8');
  await assert.rejects(changeLedger(run, 'capture', {candidates: [candidate(8), {...candidate(9), notes: 'user field'}]}), /unknown fields/);
  assert.equal(await readFile(ledger, 'utf8'), before);
  await assert.rejects(changeLedger(run, 'capture', {candidates: [candidate(8)]}, {beforeRename: () => { throw Error('simulated interruption'); }}), /simulated interruption/);
  assert.equal(await readFile(ledger, 'utf8'), before);
  assert.deepEqual(await readdir(run), ['run-ledger.jsonl']);
  await mkdir(path.join(run, 'run-ledger.lock'));
  await assert.rejects(changeLedger(run, 'capture', {candidates: [candidate(8)]}), {code: 'EEXIST'});
  await rmdir(path.join(run, 'run-ledger.lock'));
  assert.equal(await readFile(ledger, 'utf8'), before);

  state = await readLedger(run);
  await changeLedger(run, 'resolve', {revision: state.revision, updates: [{id: state.rows[3].id, state: 'excluded', reason: 'Outside approved geography', profileRevision: 'fixture-profile-v1'}]});
  state = await readLedger(run);
  await assert.rejects(changeLedger(run, 'resolve', {revision: state.revision, updates: [{id: state.rows[4].id, state: 'assessed'}]}));
  // Existing unversioned evidence must never be silently replaced during initialization.
  const legacy = path.join(root, 'legacy'); await mkdir(legacy);
  await writeFile(path.join(legacy, 'run-ledger.jsonl'), '{"title":"Old evidence"}\n');
  await assert.rejects(initializeLedger(legacy));
  assert.equal(await readFile(path.join(legacy, 'run-ledger.jsonl'), 'utf8'), '{"title":"Old evidence"}\n');
  console.log('Candidate ledger: fresh-process recovery, source merging, conservative identity, stale revision, failed writes, locking, dispositions and legacy preservation passed.');
} finally {
  // root is the exact directory returned by mkdtemp, never a computed user-data path.
  await rm(root, {recursive: true, force: true});
}
