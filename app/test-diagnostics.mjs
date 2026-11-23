import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {diagnostics, mask} from './diagnostics.mjs';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'diagnostics-'));
try {
  const root = path.join(directory, 'data'), put = (rel, value) => { const file = path.join(directory, rel); fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value)); };
  const secrets = ['PROFILE_SECRET', 'Kestrel Secret', 'Secret Title', 'jane.doe@example.com', 'kestrel.test', 'C:\\Users\\jane', 'SUMMARY_SECRET'];
  put('profile/candidate_profile.md', 'PROFILE_SECRET');
  put('BUILD_INFO.json', {version: '0.1.0', builtAt: '2026-11-23T12:15:37.018Z'});
  put('data/jobs.json', {schemaVersion: 1, jobs: [{id: 'r1', company: 'Kestrel Secret', title: 'Secret Title'}]});
  put('data/reports/setup-log.json', {updatedAt: '2026-11-23T10:00:00Z', assistant: 'Claude', steps: [{step: 1, status: 'done', note: 'ok'}, {step: 7, status: 'blocked', note: 'Gmail connector missing for jane.doe@example.com'}]});
  const run = (id, files) => { for (const [name, value] of Object.entries(files)) put(`data/reports/runs/${id}/${name}`, value); };
  for (let i = 1; i <= 6; i++) run(`run-2026112${i}0900-aaa${i}`, {'run-completion.json': {status: 'finished', startedAt: `2026-11-2${i}T08:00:00Z`}});
  const last = 'run-202611270900-zzzz';
  run(last, {
    'run-completion.json': {runId: last, status: 'finished', startedAt: '2026-11-27T08:00:00Z', profile: 'abc'},
    'run-log.json': {assistant: 'Codex', models: {lead: 'Terra', posting: 'Luna'}, startedAt: '2026-11-27T08:00:00Z', endedAt: '2026-11-27T08:40:00Z',
      access: {gmail: 'ok', browser: 'failed', subagents: 'ok'}, items: {'1': 'done', '5': 'partial', '6': 'weird'}, subagents: [{kind: 'posting', model: 'Luna', count: 2}],
      errors: [{step: '5', kind: 'employer', error: 'HTTP 403 at https://kestrel.test/jobs?x=1 reading C:\\Users\\jane\\file'}], extra: 'PROFILE_SECRET'},
    'run-ledger.jsonl': [{company: 'Kestrel Secret', title: 'Secret Title', state: 'assessed'}, {company: 'Kestrel Secret', title: 'Other', state: 'pending'}, {company: 'A', title: 'B'}].map(r => JSON.stringify(r)).join('\n'),
    'source-evidence.jsonl': [{source: 'Kestrel Secret', kind: 'employer', status: 'checked'}, {source: 'Kestrel Secret', kind: 'employer', status: 'partial'}, {source: 'portal', kind: 'portal', status: 'failed'}].map(r => JSON.stringify(r)).join('\n'),
    'summary.md': 'SUMMARY_SECRET',
  });
  put(`data/reports/2026-11-27-${last}.report.json`, {status: 'partial', added: 1, updated: 0, unchanged: 2, ambiguous: 0, rejected: [{index: 3}], errors: ['jobs[3]: bad url https://kestrel.test/x'], outcomes: [{company: 'Kestrel Secret', title: 'Secret Title'}]});

  const out = diagnostics(root, 5), text = JSON.stringify(out);
  for (const secret of secrets) assert.ok(!text.includes(secret), `bundle leaks ${secret}`);
  assert.equal(out.runs.length, 5);
  const r = out.runs.at(-1);
  assert.equal(r.run, last);
  assert.deepEqual(r.ledgerStates, {assessed: 1, pending: 1, none: 1});
  assert.deepEqual(r.sources, {employer: {checked: 1, partial: 1}, portal: {failed: 1}});
  assert.deepEqual(r.log.access, {gmail: 'ok', browser: 'failed', subagents: 'ok'});
  assert.equal(r.log.items['5'], 'partial'); assert.equal(r.log.items['6'], 'other'); assert.equal(r.log.items['2'], null);
  assert.equal(r.log.errors[0].error, 'HTTP 403 at <url> reading <path>');
  assert.deepEqual(r.import, {status: 'partial', added: 1, updated: 0, unchanged: 2, ambiguous: 0, rejected: 1, errors: ['jobs[3]: bad url <url>']});
  assert.equal(r.summarySaved, true);
  assert.equal(out.runs[0].log, null);
  assert.deepEqual(out.setup.steps[1], {step: 7, status: 'blocked', note: 'Gmail connector missing for <email>'});
  assert.equal(out.package.version, '0.1.0');
  assert.equal(mask('see /Users/jane/x and mail a@b.co'), 'see <path> and mail <email>');
  // CLI rejects bad arguments before touching any data folder.
  const cli = fileURLToPath(new URL('./diagnostics.mjs', import.meta.url));
  assert.throws(() => execFileSync(process.execPath, [cli, '--runs', 'x'], {stdio: 'pipe'}), /Usage/);
  console.log('diagnostics: all scenarios passed');
} finally {
  fs.rmSync(directory, {recursive: true, force: true});
}
