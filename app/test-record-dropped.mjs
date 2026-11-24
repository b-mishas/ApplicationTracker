import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {recordDropped} from './record-dropped.mjs';
import {check} from './capture-check.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'record-dropped-'));
const runFolder = path.join(root, 'reports', 'runs', 'run-202611231816-test');
fs.mkdirSync(runFolder, {recursive: true});
fs.writeFileSync(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: []}));
const coverage = () => JSON.parse(fs.readFileSync(path.join(root, 'reports', 'coverage.json'), 'utf8'));
fs.writeFileSync(path.join(root, 'reports', 'coverage.json'), JSON.stringify({refreshed: {x: '2026-11-20'}, dropped: [
  {provider: 'linkedin', providerJobId: '111', url: '', company: 'Veltrum', title: 'Old role', reason: 'old', droppedAt: '2026-08-01'},
  {provider: 'linkedin', providerJobId: '222', url: '', company: 'Veltrum', title: 'Known role', reason: 'known', droppedAt: '2026-11-20'},
]}));
const ledger = path.join(runFolder, 'run-ledger.jsonl');
fs.writeFileSync(ledger, [
  // Two linkless jobs of one company (the 2026-11-23 collision): both must be kept.
  {company: 'Nordkamm GmbH', title: 'Researcher - Data Management', location: 'Heidelberg', url: '', providerJobId: '', provider: 'jobvector', state: 'excluded', reason: 'no link'},
  {company: 'Nordkamm GmbH', title: 'Biologist as Scientist', location: 'Heidelberg', url: '', providerJobId: '', provider: 'jobvector', state: 'excluded', reason: 'no link'},
  {company: 'Veltrum', title: 'Known role', provider: 'linkedin', providerJobId: '222', state: 'excluded', reason: 'again'},
  {company: 'Veltrum', title: 'New ID role', provider: 'linkedin', providerJobId: '333', state: 'excluded', reason: 'low fit'},
  {company: 'Veltrum', title: 'Assessed role', provider: 'linkedin', providerJobId: '444', state: 'assessed'},
].map(r => JSON.stringify(r)).join('\n') + '\n');

assert.deepEqual(recordDropped(root, [ledger], '2026-11-24'), {added: 3, removed: 1, total: 4});
const titles = coverage().dropped.map(d => d.title);
assert.deepEqual(titles, ['Known role', 'Researcher - Data Management', 'Biologist as Scientist', 'New ID role']);
assert.equal(coverage().dropped[1].droppedAt, '2026-11-23');
assert.deepEqual(coverage().refreshed, {x: '2026-11-20'});
// Repeated call adds nothing.
assert.deepEqual(recordDropped(root, [ledger], '2026-11-24'), {added: 0, removed: 0, total: 4});
// The next run sees both linkless jobs again: as similar (name), not new.
const finds = path.join(root, 'finds.jsonl');
fs.writeFileSync(finds, [{company: 'Nordkamm GmbH', title: 'Biologist as Scientist', location: 'Heidelberg'}, {company: 'Nordkamm', title: 'Researcher - Data Management', location: 'Heidelberg'}].map(r => JSON.stringify(r)).join('\n'));
assert.deepEqual(check(root, [finds]).map(r => r.split(' | ')[0]), ['similar', 'similar']);
fs.rmSync(root, {recursive: true, force: true});
console.log('record-dropped tests passed');
