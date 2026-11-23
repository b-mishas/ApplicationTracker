// Releases ship templates/agent, templates/guides and templates/profile (scripts/build-release.mjs); the working copies
// in agent/, guides/ and profile/ must match them byte for byte, or a one-sided edit ships stale instructions.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
// Maintainer-only or private files without a template copy (agent/orchestration is maintainer guidance; the rest is Git-ignored).
const skip = rel => /^agent\/orchestration(\/|$)/.test(rel) || rel === 'agent/ROUTINE_PROMPT.filled.md'
  || /^profile\/cv\/(?!README\.txt$)/.test(rel) || /^profile\/backups(\/|$)/.test(rel) || /^profile\/[^/]*\.(lock|tmp)/.test(rel);
const files = (base, rel) => {
  const dir = path.join(base, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    const child = rel + '/' + e.name;
    return skip(child) ? [] : e.isDirectory() ? files(base, child) : [child];
  });
};
export function drift(base, names = ['agent', 'guides', 'profile']) {
  const problems = [];
  for (const name of names) {
    const work = files(base, name), copy = files(path.join(base, 'templates'), name);
    for (const rel of work) if (!copy.includes(rel)) problems.push(`${rel}: no copy in templates/`);
    for (const rel of copy) if (!work.includes(rel)) problems.push(`templates/${rel}: no working copy`);
    for (const rel of work.filter(r => copy.includes(r))) if (!fs.readFileSync(path.join(base, rel)).equals(fs.readFileSync(path.join(base, 'templates', rel)))) problems.push(`${rel}: differs from templates/${rel}`);
  }
  return problems;
}

// Self-check on a small fixture: an edited copy, a one-sided file and the skipped paths.
const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'template-drift-'));
try {
  const put = (rel, text) => { fs.mkdirSync(path.dirname(path.join(fixture, rel)), {recursive: true}); fs.writeFileSync(path.join(fixture, rel), text); };
  put('agent/ROUTINE_PROMPT.md', 'v2'); put('templates/agent/ROUTINE_PROMPT.md', 'v1');
  put('guides/A.md', 'a'); put('templates/guides/A.md', 'a'); put('templates/guides/B.md', 'b');
  put('agent/orchestration/ROADMAP.md', 'x'); put('agent/ROUTINE_PROMPT.filled.md', 'x'); put('profile/cv/cv.pdf', 'x'); put('profile/backups/p.md', 'x');
  assert.deepEqual(drift(fixture), ['agent/ROUTINE_PROMPT.md: differs from templates/agent/ROUTINE_PROMPT.md', 'templates/guides/B.md: no working copy']);
} finally {
  fs.rmSync(fixture, {recursive: true, force: true});
}

const problems = drift(root);
assert.deepEqual(problems, [], 'Update agent/, guides/, profile/ and their templates/ copies together:\n' + problems.join('\n'));
console.log('templates: working copies match templates/');
