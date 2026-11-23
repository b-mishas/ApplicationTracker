import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {check, open, profileHash} from './capture-check.mjs';

const cli = fileURLToPath(new URL('./capture-check.mjs', import.meta.url));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'capture-check-'));
const root = path.join(directory, 'data');
fs.mkdirSync(path.join(root, 'reports'), {recursive: true});
const write = (name, value) => { const file = path.join(directory, name); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); return file; };
const jsonl = (name, rows) => write(name, rows.map(r => JSON.stringify(r)).join('\n') + '\n');
fs.writeFileSync(path.join(root, 'jobs.json'), JSON.stringify({schemaVersion: 1, jobs: [
  {id: 'r1', status: 'Applied', company: 'Nordkamm GmbH', title: 'Backend Engineer (m/w/d)', city: 'Berlin', locationRaw: 'Berlin', url: 'https://jobs.nordkamm.test/NK-1', linkType: 'posting', provider: 'Nordkamm ATS', providerJobId: 'NK-1'},
  {id: 'r2', status: 'New', company: 'Veltrum', title: 'Data Engineer', city: 'Munich', locationRaw: 'Munich', url: 'https://veltrum.test/search', linkType: 'search', postingUrls: ['https://veltrum.test/jobs/VL-7'], otherIds: ['veltrumats:vl-8']},
]}));
fs.writeFileSync(path.join(root, 'reports', 'coverage.json'), JSON.stringify({dropped: [{company: 'Nordkamm', title: 'Sales Lead', url: 'https://jobs.nordkamm.test/NK-9', reason: 'Sales role'}]}));
const kind = row => row.split(' | ')[0];

try {
  // Grouping: ID match, URL with tracking parameters, record aliases, dropped list, same-title distinct requisition, other location, other company.
  const finds = jsonl('finds.jsonl', [
    {company: 'Nordkamm', title: 'Senior Backend Engineer', location: 'Berlin', provider: 'Nordkamm ATS', providerJobId: 'NK-1', requirements: ['Java']},
    {company: 'Nordkamm GmbH', title: 'Backend Engineer', location: 'Berlin', url: 'https://jobs.nordkamm.test/NK-1?utm_source=mail&trk=x'},
    {company: 'Veltrum', title: 'Data Engineer', location: 'Munich', url: 'https://www.veltrum.test/jobs/VL-7/'},
    {company: 'Veltrum', title: 'Data Engineer II', location: 'Munich', provider: 'Veltrum ATS', providerJobId: 'VL-8'},
    {company: 'Nordkamm', title: 'Sales Lead', location: 'Berlin', url: 'https://jobs.nordkamm.test/NK-9'},
    {company: 'Nordkamm', title: 'Backend Engineer (w/m/d)', location: 'Berlin', provider: 'Nordkamm ATS', providerJobId: 'NK-2'},
    {company: 'Nordkamm', title: 'Backend Engineer', location: 'Hamburg', provider: 'Nordkamm ATS', providerJobId: 'NK-3'},
    {company: 'Other Co', title: 'Backend Engineer', location: 'Berlin', provider: 'Nordkamm ATS', providerJobId: 'NK-1'},
    {company: 'Veltrum', title: 'Data Engineer', location: 'Unknown'},
  ]);
  const rows = check(root, [finds]);
  assert.deepEqual(rows.map(kind), ['known', 'known', 'known', 'known', 'known', 'similar', 'new', 'new', 'similar']);
  assert.match(rows[0], /= r1 \(Applied\)$/);
  assert.match(rows[4], /= dropped: Sales role$/);
  assert.equal(rows[5], 'similar | Nordkamm | Backend Engineer (w/m/d) | Berlin ≈ r1 (Applied)');

  // Input shapes: JSON array, {candidates}, BOM, blank lines, ledger rows with `discovery`, missing fields, broken JSONL.
  assert.deepEqual(check(root, [write('array.json', [{company: 'Other Co', title: 'QA'}])]), ['new | Other Co | QA | Unknown']);
  assert.equal(check(root, [write('cands.json', '﻿' + JSON.stringify({candidates: [{company: 'Veltrum', title: 'Data Engineer', location: 'Munich', postingUrl: 'https://veltrum.test/jobs/VL-7'}]}))]).map(kind)[0], 'known');
  assert.deepEqual(check(root, [write('blank.jsonl', '\n' + JSON.stringify({company: 'A', title: 'B'}) + '\n\n')]), ['new | A | B | Unknown']);
  assert.deepEqual(check(root, [write('empty.jsonl', '')]), []);
  assert.match(check(root, [write('bad.json', [{title: 'No company'}])])[0], /^invalid \| .*needs company and title/);
  assert.throws(() => check(root, [write('broken.jsonl', '{"company":"A","title":"B"}\n{broken\n')]), /broken\.jsonl: line 2 is not JSON/);
  assert.deepEqual(check(path.join(directory, 'no-data'), [write('fresh.json', [{company: 'A', title: 'B', location: 'Berlin'}])]), ['new | A | B | Berlin']);

  // Reconciliation across runs (data/reports/runs/<run>/run-ledger.jsonl, oldest first by run ID).
  fs.mkdirSync(path.join(directory, 'profile'));
  fs.writeFileSync(path.join(directory, 'profile', 'candidate_profile.md'), 'Profile v1');
  const v1 = profileHash(root), v0 = 'a'.repeat(64);
  const runFolder = (run, completion, rows) => {
    const folder = path.join(root, 'reports', 'runs', run); fs.mkdirSync(folder, {recursive: true});
    if (completion) fs.writeFileSync(path.join(folder, completion.file), JSON.stringify(completion.value));
    const file = path.join(folder, 'run-ledger.jsonl'); fs.writeFileSync(file, rows.map(r => typeof r === 'string' ? r : JSON.stringify(r)).join('\n') + '\n'); return file;
  };
  // Old run-state run: v3 manifest with profileRevision, nested `discovery`, a finished run whose open finds must still show.
  runFolder('run-202611200900-old1', {file: 'manifest.json', value: {schemaVersion: 3, profileRevision: v0, finishedAt: '2026-11-20T10:00:00Z'}}, [
    {id: 'a1', discovery: {company: 'Veltrum', title: 'ML Engineer', location: 'Munich'}, state: 'pending'},
    {id: 'a2', discovery: {company: 'Other Co', title: 'Sales', location: 'Berlin'}, state: 'excluded', reason: 'Sales role', profileRevision: v0},
    {id: 'a3', discovery: {company: 'Other Co', title: 'Carried', location: 'Berlin', url: 'https://other.test/jobs/1'}, state: 'pending'},
  ]);
  // Finished plain-ledger run under the current profile, including unknown and spaced states.
  runFolder('run-202611210900-mid2', {file: 'run-completion.json', value: {runId: 'run-202611210900-mid2', status: 'finished', profile: v1}}, [
    {company: 'Nordkamm', title: 'Backend Engineer', location: 'Hamburg', provider: 'Nordkamm ATS', providerJobId: 'NK-3', state: 'pending'},
    {company: 'Other Co', title: 'QA', location: 'Berlin'},
    {company: 'Other Co', title: 'Platform Engineer', location: 'Berlin', state: 'assessed ', fit: 4},
    {company: 'Nordkamm', title: 'Backend Engineer', location: 'Berlin', provider: 'Nordkamm ATS', providerJobId: 'NK-1', state: 'assessed', fit: 4},
    {company: 'Other Co', title: 'Ops', location: 'Berlin', state: 'excluded', reason: 'Ops role'},
    {company: 'Veltrum', title: 'Data Engineer', location: 'Munich', state: 'duplicate', reason: 'Same as r2'},
    {company: 'Other Co', title: 'Deferred', location: 'Berlin', state: 'deferred'},
    // The carried find comes back with an extra provider ID and is decided here: the old pending entry no longer shows.
    {company: 'Other Co', title: 'Carried', location: 'Berlin', url: 'https://other.test/jobs/1?utm_source=x', provider: 'Other ATS', providerJobId: '1', state: 'excluded', reason: 'Too junior'},
  ]);
  // Run without a profile marker: its exclusion cannot count as current.
  const latest = runFolder('run-202611220900-new3', null, [{company: 'Other Co', title: 'Unmarked', location: 'Berlin', state: 'excluded', reason: 'x'}]);
  const all = open(root);
  assert.deepEqual(all, [
    `profile ${v1}`,
    'open | pending | run-202611200900-old1 | Veltrum | ML Engineer | Munich',
    'open | reassess (excluded under another profile) | run-202611200900-old1 | Other Co | Sales | Berlin',
    'open | pending | run-202611210900-mid2 | Nordkamm | Backend Engineer | Hamburg',
    'open | no state | run-202611210900-mid2 | Other Co | QA | Berlin',
    'open | assessed, not imported | run-202611210900-mid2 | Other Co | Platform Engineer | Berlin',
    'open | unknown state "deferred" | run-202611210900-mid2 | Other Co | Deferred | Berlin',
    'open | reassess (excluded under another profile) | run-202611220900-new3 | Other Co | Unmarked | Berlin',
  ]);
  assert.deepEqual(open(root, [latest]), [`profile ${v1}`, 'open | reassess (excluded under another profile) | run-202611220900-new3 | Other Co | Unmarked | Berlin']);
  const done = runFolder('run-202611230900-done', {file: 'run-completion.json', value: {profile: v1}}, [{company: 'A', title: 'B', state: 'excluded', reason: 'x'}]);
  assert.deepEqual(open(root, [done]), [`profile ${v1}`, 'open: none']);
  // A broken or missing ledger is reported, not skipped silently, and the others are still checked.
  const broken = runFolder('run-202611240900-bad4', null, ['{"company":"A","title":"B","state":"pending"}', '{broken']);
  assert.match(open(root, [broken, done]).join('\n'), /open \| unreadable ledger \| run-202611240900-bad4 \| .*line 2 is not JSON$/);
  assert.match(open(root, [path.join(root, 'reports', 'runs', 'none', 'run-ledger.jsonl')])[1], /^open \| unreadable ledger \| none \|/);
  fs.rmSync(path.dirname(broken), {recursive: true});
  // A changed profile turns current-profile decisions not yet in jobs.json into reassess.
  fs.writeFileSync(path.join(directory, 'profile', 'candidate_profile.md'), 'Profile v2');
  assert.ok(open(root).includes('open | reassess (assessed under another profile) | run-202611210900-mid2 | Other Co | Platform Engineer | Berlin'));
  assert.ok(open(root).includes('open | reassess (excluded under another profile) | run-202611210900-mid2 | Other Co | Ops | Berlin'));
  fs.writeFileSync(path.join(directory, 'profile', 'candidate_profile.md'), 'Profile v1');

  // CLI reads data/ under the working directory and fails with a message on bad input.
  const run = args => execFileSync(process.execPath, [cli, ...args], {cwd: directory, encoding: 'utf8'});
  assert.equal(run([finds]).trim().split('\n').length, 9);
  assert.deepEqual(run(['--open']).trim().split('\n'), all);
  assert.deepEqual(run(['--open', done]).trim().split('\n'), [`profile ${v1}`, 'open: none']);
  assert.throws(() => execFileSync(process.execPath, [cli], {cwd: directory, stdio: 'pipe'}), /Usage/);
  assert.throws(() => execFileSync(process.execPath, [cli, path.join(directory, 'broken.jsonl')], {cwd: directory, stdio: 'pipe'}), /line 2 is not JSON/);
  // Wrong ROOT or missing profile: the CLI refuses instead of printing everything as new or nothing as open.
  const empty = fs.mkdtempSync(path.join(directory, 'noroot-'));
  const status = args => { try { execFileSync(process.execPath, [cli, ...args], {cwd: empty, stdio: 'pipe'}); return 0; } catch (error) { return error.status; } };
  assert.equal(status([finds]), 2);
  assert.equal(status(['--open']), 2);
  fs.mkdirSync(path.join(empty, 'data')); fs.writeFileSync(path.join(empty, 'data', 'jobs.json'), JSON.stringify({jobs: []}));
  assert.equal(status([finds]), 0);
  assert.equal(status(['--open']), 2);
  assert.equal(status(['--open', '--seen', finds]), 1);

  // Same vacancy from two sources in one run: `repeat` against this run's ledger and within one call.
  const ledger = jsonl('today.jsonl', [{company: 'Kestrel', title: 'Data Steward', location: 'Berlin', url: 'https://kestrel.test/jobs/5', state: 'pending'}]);
  const board = jsonl('board.jsonl', [
    {company: 'Kestrel', title: 'Data Steward (m/w/d)', location: 'Berlin', url: 'https://kestrel.test/jobs/5?utm_source=board'},
    {company: 'Kestrel', title: 'Data Lead', location: 'Berlin', url: 'https://kestrel.test/jobs/6'},
    {company: 'Kestrel', title: 'Data Lead', location: 'Berlin', url: 'https://kestrel.test/jobs/6'},
    {company: 'Kestrel', title: 'Data Steward', location: 'Berlin'},
  ]);
  assert.deepEqual(check(root, [board], [ledger]).map(kind), ['repeat', 'new', 'repeat', 'similar']);
  assert.match(check(root, [board], [ledger])[0], /= ledger: Kestrel \| Data Steward \| Berlin/);
  assert.deepEqual(run(['--seen', ledger, board]).trim().split('\n').map(kind), ['repeat', 'new', 'repeat', 'similar']);

  // A pending find without ID or URL that later gains one is one vacancy; a same-title second requisition stays separate.
  const other = path.join(directory, 'other', 'data');
  fs.mkdirSync(path.join(directory, 'other', 'profile'), {recursive: true});
  fs.writeFileSync(path.join(directory, 'other', 'profile', 'candidate_profile.md'), 'Profile v1');
  fs.mkdirSync(other); fs.writeFileSync(path.join(other, 'jobs.json'), JSON.stringify({jobs: [{id: 'k1', status: 'New', company: 'Kestrel', title: 'Data Lead', city: 'Berlin', url: 'https://kestrel.test/jobs/6', linkType: 'posting'}]}));
  const otherRun = (run, rows) => { const folder = path.join(other, 'reports', 'runs', run); fs.mkdirSync(folder, {recursive: true}); fs.writeFileSync(path.join(folder, 'run-completion.json'), JSON.stringify({profile: profileHash(other)})); fs.writeFileSync(path.join(folder, 'run-ledger.jsonl'), rows.map(r => JSON.stringify(r)).join('\n')); };
  otherRun('run-202611250900-aaaa', [
    {company: 'Kestrel', title: 'Data Steward', location: 'Berlin', state: 'pending'},
    {company: 'Kestrel', title: 'Data Lead', location: 'Berlin', state: 'pending'},
  ]);
  otherRun('run-202611260900-bbbb', [
    {company: 'Kestrel', title: 'Data Steward', location: 'Berlin', url: 'https://kestrel.test/jobs/5', state: 'excluded', reason: 'Too junior'},
    {company: 'Kestrel', title: 'Data Steward', location: 'Berlin', url: 'https://kestrel.test/jobs/7', state: 'pending'},
    {company: 'Kestrel', title: 'Data Lead', location: 'Berlin', url: 'https://kestrel.test/jobs/6', state: 'assessed', fit: 4},
    {company: 'Kestrel', title: 'Data Lead', location: 'Berlin', state: 'assessed', fit: 4},
  ]);
  assert.deepEqual(open(other), [`profile ${profileHash(other)}`, 'open | pending | run-202611260900-bbbb | Kestrel | Data Steward | Berlin | https://kestrel.test/jobs/7']);
  console.log('capture-check: all scenarios passed');
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
