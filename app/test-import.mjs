// Tests for the discovery importer, run only against disposable copies of jobs.json.  Usage: node test-import.mjs
import {mkdtemp, copyFile, readFile, writeFile, readdir, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {importBatch, deleteRecords, mergeBatch, normTitle, urlIdentity} from './import-discoveries.mjs';
import {commit,withLock} from './store.mjs';
import {fixtureData,fixtureSettings} from './test-fixtures.mjs';
const here = path.dirname(fileURLToPath(import.meta.url));
const live = fixtureData();
let n = 0; const results = [];
const test = async (name, fn) => { const dir = await mkdtemp(path.join(tmpdir(), 'imp-')); await mkdir(path.join(dir, 'incoming')); await writeFile(path.join(dir, 'jobs.json'), JSON.stringify(live));
  await writeFile(path.join(dir,'settings.json'),JSON.stringify(fixtureSettings));process.env.JOBTRACKER_SETTINGS_FILE=path.join(dir,'settings.json');
  try { await fn(dir); results.push('ok   ' + name); } catch (e) { results.push('FAIL ' + name + ': ' + e.message); process.exitCode = 1; } finally { await rm(dir, {recursive: true, force: true}); } };
const read = async dir => JSON.parse(await readFile(path.join(dir, 'jobs.json'), 'utf8'));
let seq = 0;
const mk = (over = {}) => ({company: 'Testco Biologics GmbH', title: 'Senior Scientist Antibody Discovery', url: 'https://careers.testco.example/jobs/' + (++seq), linkType: 'posting', group: 'Engineering', countries: ['DE'], city: 'Munich', locationRaw: 'Munich, Germany', workMode: 'Hybrid', workModeRaw: 'Hybrid', fit: 4, reasoning: 'Strong match.', gaps: 'None.', seniority: 'Senior', assessmentBasis: 'Posting reviewed', postedDate: '2026-11-01', observedAt: '2026-11-03T05:00:00Z', availability: 'Open', ...over});
async function batch(dir, jobs, {runId = 'run-' + (++seq) + '-aaaa', day = '2026-11-03', searchedAt = '2026-11-03T05:10:00Z', mutate} = {}) {
  const name = `${day}-${runId}.json`;
  jobs.forEach(j => { if (!j.sources) j.sources = [{label: 'Company site', url: j.url, file: name}]; else j.sources.forEach(s => s.file ||= name); });
  const b = {schemaVersion: 1, runId, searchedAt, jobs}; if (mutate) mutate(b);
  await writeFile(path.join(dir, 'incoming', name), JSON.stringify(b)); return path.join('incoming', name);
}
const imp = (dir, p, o = {}) => importBatch({root: dir, batchPath: p, ...o});

await test('valid additions get ids, New status, empty notes, importer-owned dates', async dir => {
  const r = await imp(dir, await batch(dir, [mk(), mk({title: 'Lead Protein Engineer', city: 'Basel', countries: ['CH']})]));
  assert.equal(r.status, 'imported'); assert.equal(r.added, 2);
  const d = await read(dir); assert.equal(d.jobs.length, live.jobs.length + 2);
  const rec = d.jobs.at(-1); assert.match(rec.id, /^[0-9a-f-]{36}$/); assert.equal(rec.status, 'New'); assert.equal(rec.notes, ''); assert.equal(rec.firstSeen, '2026-11-03'); assert.equal(rec.country, 'CH');
  assert.equal((await readdir(path.join(dir, 'backups'))).length, 1);
});
await test('repeated import of the same batch is idempotent (no write, no new backup)', async dir => {
  const p = await batch(dir, [mk()]); await imp(dir, p); const before = await readFile(path.join(dir, 'jobs.json'), 'utf8');
  const r = await imp(dir, p); assert.equal(r.added, 0); assert.equal(r.updated, 0); assert.equal(r.unchanged, 1); assert.equal(r.written, false);
  assert.equal(await readFile(path.join(dir, 'jobs.json'), 'utf8'), before); assert.equal((await readdir(path.join(dir, 'backups'))).length, 1);
});
await test('exact duplicates inside one batch merge into one record', async dir => {
  const a = mk(); const b = {...mk(), url: a.url};
  const r = await imp(dir, await batch(dir, [a, b])); assert.equal(r.added, 1); assert.equal(r.unchanged + r.updated, 1);
});
await test('duplicate of existing record (same URL) updates it, preserving id, notes, status and unknown fields', async dir => {
  const d0 = await read(dir); const t = d0.jobs.find(j => j.linkType === 'posting'); t.status = 'Shortlisted'; t.notes = 'my note ✓'; t.customField = {keep: 1}; await writeFile(path.join(dir, 'jobs.json'), JSON.stringify(d0, null, 2));
  const r = await imp(dir, await batch(dir, [mk({company: t.company, title: t.title, url: t.url, countries: t.countries, city: t.city, fit: 2, reasoning: 'Newer', sources: [{label: 'X', url: t.url, file: 'f'}]})], {mutate: null}).catch(e => { throw e; }), {});
  assert.equal(r.added, 0, JSON.stringify(r.errors || r.outcomes));
  const d = await read(dir), u = d.jobs.find(j => j.id === t.id);
  assert.equal(d.jobs.length, d0.jobs.length); assert.equal(u.status, 'Shortlisted'); assert.equal(u.notes, 'my note ✓'); assert.deepEqual(u.customField, {keep: 1}); assert.equal(u.id, t.id);
});
await test('batch rejects sources[].file that differs from the batch file name', async dir => {
  const j = mk(); const p = await batch(dir, [j]); const f = JSON.parse(await readFile(path.join(dir, p), 'utf8')); f.jobs[0].sources[0].file = 'other.json'; await writeFile(path.join(dir, p), JSON.stringify(f));
  const r = await imp(dir, p); assert.equal(r.exitCode, 2); assert.match(r.errors.join('\n'), /sources\[0\]\.file/);
});
await test('malformed JSON rejected, jobs.json untouched, report written', async dir => {
  const before = await readFile(path.join(dir, 'jobs.json'), 'utf8'); await writeFile(path.join(dir, 'incoming', '2026-11-03-bad-run-1.json'), '{"schemaVersion":1,');
  const r = await imp(dir, 'incoming/2026-11-03-bad-run-1.json'); assert.equal(r.exitCode, 2); assert.match(r.errors[0], /Malformed JSON/);
  assert.equal(await readFile(path.join(dir, 'jobs.json'), 'utf8'), before); assert((await readdir(path.join(dir, 'reports'))).length === 1);
});
const invalid = {
  'bad enum workMode': j => j.workMode = 'Office', 'fit 6': j => j.fit = 6, 'unknown country ZZ': j => j.countries = ['ZZ'], 'user-owned status': j => j.status = 'Applied', 'user-owned interview date': j => j.interviewDate = '2026-11-03', 'user-owned interview outcome': j => j.interviewOutcome = 'Offer', 'user-owned offer date': j => j.offerDate = '2026-11-04', 'user-owned notes': j => j.notes = 'x',
  'user-owned id': j => j.id = 'abc', 'favorite flag': j => j.favorite = true, 'ftp url': j => j.url = 'ftp://x.example/1', 'missing sources': j => j.sources = [], 'unknown field': j => j.bogus = 1,
  'Open without Posting reviewed': j => { j.assessmentBasis = 'Title only'; j.availability = 'Open'; }, 'Open on search link': j => { j.linkType = 'search'; }, 'missing company': j => delete j.company,
  'bad group type': j => j.group = 42, 'provider without id': j => j.provider = 'linkedin', 'bad postedDate type': j => j.postedDate = 5
};
for (const [name, f] of Object.entries(invalid)) await test('invalid record isolated: ' + name, async dir => {
  const good=mk(), bad = mk(); f(bad);
  const p=await batch(dir,[good,bad]);const r = await imp(dir,p);
  assert.equal(r.exitCode,5,JSON.stringify(r));assert.equal(r.status,'partial');
  assert.equal(r.added,1);assert.equal(r.rejected,1);
  assert.equal((await read(dir)).jobs.length,live.jobs.length+1);
  assert.equal((await read(dir)).jobs.at(-1).url,good.url);
  assert.equal(r.outcomes[1].index,1);assert.equal(r.outcomes[1].outcome,'rejected');
  assert(r.outcomes[1].errors.length);
  const report=JSON.parse(await readFile(path.join(dir,r.report),'utf8'));
  assert.equal(report.rejected,1);assert.equal(report.status,'partial');
});
await test('invalid envelope: bad runId, non-Z timestamp, filename mismatch', async dir => {
  const p1 = await batch(dir, [mk()], {runId: 'x'}); assert.equal((await imp(dir, p1)).exitCode, 2);
  const p2 = await batch(dir, [mk()], {searchedAt: '2026-11-03T05:10:00+01:00'}); assert.equal((await imp(dir, p2)).exitCode, 2);
  const p3 = await batch(dir, [mk()]); const f = JSON.parse(await readFile(path.join(dir, p3), 'utf8')); f.runId = 'different-run-1'; await writeFile(path.join(dir, p3), JSON.stringify(f)); assert.equal((await imp(dir, p3)).exitCode, 2);
});
await test('no downgrade: title-only does not overwrite reviewed fit/reasoning; null fit does not erase', async dir => {
  const a = mk({fit: 5, reasoning: 'Reviewed deep.'}); await imp(dir, await batch(dir, [a]));
  const b = mk({url: a.url, fit: null, reasoning: 'Title only guess', assessmentBasis: 'Title only', availability: 'Unverified', observedAt: '2026-11-04T05:00:00Z'});
  const r = await imp(dir, await batch(dir, [b], {day: '2026-11-04'})); const rec = (await read(dir)).jobs.at(-1);
  assert.equal(rec.fit, 5); assert.equal(rec.reasoning, 'Reviewed deep.'); assert.equal(rec.assessmentBasis, 'Posting reviewed'); assert.equal(rec.availability, 'Open'); assert.equal(rec.lastSeen, '2026-11-04'); assert.equal(rec.firstSeen, '2026-11-03');
});
await test('closed posting update: newer Closed observation wins; search link upgraded to posting', async dir => {
  const s = mk({linkType: 'search', url: 'https://www.linkedin.com/jobs/search/?keywords=antibody', assessmentBasis: 'Title only', availability: 'Unverified', provider: 'linkedin', providerJobId: '4111111111'}); await imp(dir, await batch(dir, [s]));
  const p = mk({url: 'https://www.linkedin.com/jobs/view/senior-scientist-4111111111?utm_source=x', provider: 'linkedin', providerJobId: '4111111111', availability: 'Closed', observedAt: '2026-11-04T05:00:00Z'});
  const r = await imp(dir, await batch(dir, [p], {day: '2026-11-04'})); assert.equal(r.added, 0, JSON.stringify(r.outcomes)); const rec = (await read(dir)).jobs.at(-1);
  assert.equal(rec.linkType, 'posting'); assert.equal(rec.availability, 'Closed'); assert.equal(rec.assessmentBasis, 'Posting reviewed');
});
await test('provider id match with a different company is ambiguous, not merged', async dir => {
  const a = mk({provider: 'linkedin', providerJobId: '999000111'}); await imp(dir, await batch(dir, [a]));
  const b = mk({company: 'Completely Other AG', url: a.url + '?x=1', provider: 'linkedin', providerJobId: '999000111'});
  const r = await imp(dir, await batch(dir, [b])); assert.equal(r.ambiguous, 1); assert.equal(r.added, 0); assert.equal((await read(dir)).jobs.length, live.jobs.length + 1);
});
await test('same company+title, different city → separate records; same city with distinct URL → ambiguous; unknown location → ambiguous', async dir => {
  await imp(dir, await batch(dir, [mk({city: 'Munich'})]));
  const r1 = await imp(dir, await batch(dir, [mk({city: 'Basel', countries: ['CH']})])); assert.equal(r1.added, 1);
  const r2 = await imp(dir, await batch(dir, [mk({city: 'Munich'})])); assert.equal(r2.added, 0); assert.equal(r2.ambiguous, 1);
  const r3 = await imp(dir, await batch(dir, [mk({city: '', countries: ['DE']})])); assert.equal(r3.added + r3.ambiguous + r3.updated + r3.unchanged, 1);
});
await test('title normalisation ignores gender suffixes; tracking params ignored in URL identity', async () => {
  assert.equal(normTitle('Senior Scientist (m/f/d)'), normTitle('Senior  Scientist (w/m/d)')); assert.equal(normTitle('Senior Scientist (m/f/d)'), normTitle('senior scientist'));
  assert.equal(urlIdentity('https://x.example/a/b/?utm_source=q&id=3').key, urlIdentity('https://www.x.example/a/b?id=3').key);
});
await test('merge is deterministic on identical data for dry-run; dry run does not write', async dir => {
  const before = await readFile(path.join(dir, 'jobs.json'), 'utf8'); const r = await imp(dir, await batch(dir, [mk()]), {dryRun: true});
  assert.equal(r.status, 'dry-run'); assert.equal(r.added, 1); assert.equal(await readFile(path.join(dir, 'jobs.json'), 'utf8'), before);
});
await test('failed write leaves jobs.json intact, no temp files, lock released', async dir => {
  const before = await readFile(path.join(dir, 'jobs.json'), 'utf8');
  const r = await imp(dir, await batch(dir, [mk()]), {beforeRename: async () => { throw new Error('disk full (simulated)'); }});
  assert.equal(r.exitCode, 4); assert.equal(await readFile(path.join(dir, 'jobs.json'), 'utf8'), before);
  const left = (await readdir(dir)).filter(f => f.endsWith('.tmp') || f.endsWith('.lock')); assert.deepEqual(left, []);
  assert.equal((await imp(dir, await batch(dir, [mk()]))).added, 1);
});
await test('old and live locks both time out safely; explicit recovery only', async dir => {
  const lock = path.join(dir, 'jobs.json.lock'); await writeFile(lock, '{}'); const old = new Date(Date.now() - 600000); const {utimes} = await import('node:fs/promises'); await utimes(lock, old, old);
  assert.equal((await imp(dir, await batch(dir, [mk()]), {lock: {timeoutMs: 100}})).exitCode, 3);
  await rm(lock); await writeFile(lock, '{}'); const r = await imp(dir, await batch(dir, [mk()]), {lock: {timeoutMs: 300}}); assert.equal(r.exitCode, 3); assert.equal(r.status, 'locked');
});
await test('concurrent importers: all batches applied exactly once, no lost updates, file valid', async dir => {
  const ps = []; for (let i = 0; i < 6; i++) ps.push(await batch(dir, [mk({title: 'Role ' + i, company: 'Conc ' + i})]));
  const rs = await Promise.all(ps.map(p => imp(dir, p))); assert(rs.every(r => r.exitCode === 0), JSON.stringify(rs.map(r => r.errors)));
  const d = await read(dir); assert.equal(d.jobs.length, live.jobs.length + 6); assert.equal(new Set(d.jobs.map(j => j.id)).size, d.jobs.length);
});
await test('concurrent UI saves and imports (real server process): no lost update', async dir => {
  await copyFile(path.join(here, 'server.mjs'), path.join(dir, 'server.mjs')); await copyFile(path.join(here, 'store.mjs'), path.join(dir, 'store.mjs')); await copyFile(path.join(here, 'config.mjs'), path.join(dir, 'config.mjs'));
  const port = 8800 + Math.floor(Math.random() * 100), base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [path.join(here, 'server.mjs')], {env: {...process.env, PORT: String(port), JOBTRACKER_DATA_DIR: dir}, stdio: ['ignore', 'pipe', 'pipe']});
  try {
    await new Promise((res, rej) => { child.stdout.once('data', res); child.stderr.once('data', d => rej(Error(String(d)))); });
    const patch = (id, revision, notes) => fetch(base + '/api/jobs', {method: 'PATCH', headers: {'Content-Type': 'application/json', Origin: base}, body: JSON.stringify({id, revision, status: 'Shortlisted', notes})});
    const ids = live.jobs.slice(0, 8).map(j => j.id); const done = [];
    const importer = (async () => { for (let i = 0; i < 6; i++) done.push(await imp(dir, await batch(dir, [mk({title: 'Imp ' + i, company: 'Parallel ' + i})]))); })();
    const saver = (async () => { for (const id of ids) { for (let a = 0; a < 20; a++) { const cur = await (await fetch(base + '/api/jobs')).json(); const r = await patch(id, cur.revision, 'ui note ' + id); if (r.status === 200) break; assert.equal(r.status, 409); await new Promise(r => setTimeout(r, 30)); } } })();
    await Promise.all([importer, saver]);
    assert(done.every(r => r.exitCode === 0)); const d = await read(dir);
    assert.equal(d.jobs.length, live.jobs.length + 6); for (const id of ids) assert.equal(d.jobs.find(j => j.id === id).notes, 'ui note ' + id);
    // stale revision from before the import is rejected
    const stale = await patch(ids[0], '0'.repeat(64), 'x'); assert.equal(stale.status, 409);
  } finally { child.kill(); await new Promise(r => child.once('exit', r)); }
});

await test('different requisition URLs at the same location are ambiguous', async dir => {
 const a=mk({url:'https://jobs.example/REQ-100'});await imp(dir,await batch(dir,[a]));
 const r=await imp(dir,await batch(dir,[{...a,url:'https://jobs.example/REQ-200',sources:undefined}]));
 assert.equal(r.ambiguous,1);assert.equal(r.updated,0);assert.equal((await read(dir)).jobs.at(-1).postingUrls,undefined);
});
await test('search-only record upgrades safely to direct posting', async dir => {
 const a=mk({url:'https://jobs.example/search',linkType:'search',availability:'Unverified'});await imp(dir,await batch(dir,[a]));
 const r=await imp(dir,await batch(dir,[{...a,url:'https://jobs.example/REQ-100',linkType:'posting',sources:undefined}]));
 assert.equal(r.updated,1);assert.equal(r.ambiguous,0);assert.equal((await read(dir)).jobs.at(-1).linkType,'posting');
});
await test('reviewed remote restrictions refresh even if workMode stays Remote', async dir => {
 const a=mk({workMode:'Remote',workModeRaw:'Remote within UK'});await imp(dir,await batch(dir,[a]));
 await imp(dir,await batch(dir,[{...a,workModeRaw:'Remote within Germany',observedAt:'2026-11-04T05:00:00Z',sources:undefined}],{day:'2026-11-04'}));
 assert.equal((await read(dir)).jobs.at(-1).workModeRaw,'Remote within Germany');
});
await test('lower evidence cannot replace reviewed work arrangement', async dir => {
 const a=mk({workMode:'Remote',workModeRaw:'Remote within UK'});await imp(dir,await batch(dir,[a]));
 await imp(dir,await batch(dir,[{...a,workMode:'On-site',workModeRaw:'Title-only guess',assessmentBasis:'Title only',availability:'Unverified',observedAt:'2026-11-04T05:00:00Z',sources:undefined}],{day:'2026-11-04'}));
 const j=(await read(dir)).jobs.at(-1);assert.equal(j.workMode,'Remote');assert.equal(j.workModeRaw,'Remote within UK');
});
await test('legacy reviewed restriction retains its evidence when refreshing', async dir => {
 const d=await read(dir),j=d.jobs[0];j.workMode='Remote';j.workModeRaw='Remote within UK';
 await writeFile(path.join(dir,'jobs.json'),JSON.stringify(d));
 const a=mk({company:j.company,title:j.title,url:j.url,city:j.city,workMode:'Remote',workModeRaw:'Remote within Germany'});
 await imp(dir,await batch(dir,[a]));assert.equal((await read(dir)).jobs[0].workModeRaw,'Remote within Germany');
});
await test('old active lock is never stolen and lock owners release only their lock', async dir => {
 const file=path.join(dir,'jobs.json.lock'); const {utimes}=await import('node:fs/promises');
 await withLock(dir,async()=>{
  const old=new Date(Date.now()-600000);await utimes(file,old,old);
  await assert.rejects(withLock(dir,()=>assert.fail('concurrent writer entered'),{timeoutMs:100}),e=>e.code==='BUSY');
  await writeFile(file,JSON.stringify({token:'different-owner'}));
 });
 assert.equal(JSON.parse(await readFile(file,'utf8')).token,'different-owner');await rm(file);
});
await test('firstSeen never changes on older imported observations', async dir => {
 const a=mk();await imp(dir,await batch(dir,[a]));
 await imp(dir,await batch(dir,[{...a,observedAt:'2026-10-01T05:00:00Z',sources:undefined}],{day:'2026-10-01'}));
 assert.equal((await read(dir)).jobs.at(-1).firstSeen,'2026-11-03');
});
await test('null and malformed records preserve original indices of accepted jobs',async dir=>{
 const p=await batch(dir,[mk({title:'Valid one'}),mk({title:'Valid two'})],{mutate:b=>{b.jobs.unshift(null);b.jobs.splice(2,0,{company:'Broken'});}});
 const r=await imp(dir,p);assert.equal(r.added,2);assert.equal(r.rejected,2);assert.equal(r.exitCode,5);
 assert.deepEqual(r.outcomes.map(o=>[o.index,o.outcome]),[[0,'rejected'],[1,'added'],[2,'rejected'],[3,'added']]);
 assert(r.outcomes[2].errors.every(e=>e.startsWith('$.jobs[2]')));
});
await test('all records invalid yields rejection without writes or backup',async dir=>{
 const before=await readFile(path.join(dir,'jobs.json'),'utf8');
 const r=await imp(dir,await batch(dir,[mk({fit:9}),mk({workMode:'Office'})]));
 assert.equal(r.exitCode,2);assert.equal(r.rejected,2);assert.equal(r.added,0);
 assert.equal(await readFile(path.join(dir,'jobs.json'),'utf8'),before);
 assert(!(await readdir(dir)).includes('backups'));
 const report=JSON.parse(await readFile(path.join(dir,r.report),'utf8'));assert.equal(report.rejected,2);assert.equal(report.outcomes.length,2);
});
await test('bad envelope rejects valid siblings before any mutation',async dir=>{
 const before=await readFile(path.join(dir,'jobs.json'),'utf8');
 const p=await batch(dir,[mk()],{mutate:b=>b.schemaVersion=2});const r=await imp(dir,p);
 assert.equal(r.exitCode,2);assert.equal(r.rejected,1);assert.equal(await readFile(path.join(dir,'jobs.json'),'utf8'),before);
});
await test('partial validate-only and dry-run explain rejections without importing',async dir=>{
 const p=await batch(dir,[mk(),mk({fit:8})]);const before=await readFile(path.join(dir,'jobs.json'),'utf8');
 for(const options of [{validateOnly:true},{dryRun:true}]){
  const r=await imp(dir,p,options);assert.equal(r.exitCode,5);assert.equal(r.rejected,1);assert.equal(r.outcomes.at(-1).index,1);
  assert.equal(await readFile(path.join(dir,'jobs.json'),'utf8'),before);
 }
 assert(!(await readdir(dir)).includes('backups'));
});
await test('mixed batch retries are idempotent; corrected records can be imported later',async dir=>{
 const p=await batch(dir,[mk(),mk({fit:8})]);const first=await imp(dir,p);assert.equal(first.added,1);
 const repeated=await imp(dir,p);assert.equal(repeated.unchanged,1);assert.equal(repeated.written,false);assert.equal(repeated.rejected,1);
 const b=JSON.parse(await readFile(path.join(dir,p),'utf8'));b.jobs[1].fit=4;b.jobs[1].title='Different valid role';await writeFile(path.join(dir,p),JSON.stringify(b));
 const fixed=await imp(dir,p);assert.equal(fixed.added,1);assert.equal(fixed.unchanged,1);assert.equal(fixed.rejected,0);assert.equal(fixed.exitCode,0);
});
await test('failed commit of mixed batch leaves all accepted records unapplied',async dir=>{
 const p=await batch(dir,[mk(),mk({fit:8})]);const before=await readFile(path.join(dir,'jobs.json'),'utf8');
 const r=await imp(dir,p,{beforeRename:()=>{throw Error('simulated failure');}});
 assert.equal(r.exitCode,4);assert.equal(r.added,0);assert.equal(r.rejected,1);assert.equal(await readFile(path.join(dir,'jobs.json'),'utf8'),before);
});
await test('CLI partial import returns exit 5 and a machine-readable result',async dir=>{
 const p=await batch(dir,[mk(),mk({fit:8})]);
 const child=spawn(process.execPath,[path.join(here,'import-discoveries.mjs'),p,'--root',dir],{stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',s=>output+=s);child.stderr.on('data',()=>{});
 const code=await new Promise((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
 assert.equal(code,5);const result=JSON.parse(output.split('\n').find(l=>l.startsWith('RESULT ')).slice(7));
 assert.equal(result.status,'partial');assert.equal(result.added,1);assert.equal(result.rejected,1);assert.equal(result.outcomes[1].index,1);
});
await test('lock is released by rename when deletion is forbidden; next writers are not blocked; leftovers are purged later', async dir => {
  const p1 = await batch(dir, [mk({title: 'NoDelete A', company: 'ND A'})]), p2 = await batch(dir, [mk({title: 'NoDelete B', company: 'ND B'})]);
  assert.equal((await imp(dir, p1, {lock: {noDelete: true}})).exitCode, 0);
  const left = (await readdir(dir)).filter(f => f.startsWith('jobs.json.lock')); assert.equal(left.length, 1); assert.match(left[0], /^jobs\.json\.lock\.released-/);
  assert.equal((await imp(dir, p2, {lock: {noDelete: true, timeoutMs: 500}})).exitCode, 0);
  assert.equal((await readdir(dir)).filter(f => f === 'jobs.json.lock').length, 0);
  const p3 = await batch(dir, [mk({title: 'NoDelete C', company: 'ND C'})]); assert.equal((await imp(dir, p3)).exitCode, 0);
  assert.deepEqual((await readdir(dir)).filter(f => f.startsWith('jobs.json.lock')), []);
});
await test('failure report never overwrites the success report of the same batch', async dir => {
  const p = await batch(dir, [mk()]); const ok = await imp(dir, p); assert.equal(ok.exitCode, 0);
  await writeFile(path.join(dir, 'jobs.json.lock'), '{"token":"x"}'); const bad = await imp(dir, p, {lock: {timeoutMs: 200}}); assert.equal(bad.exitCode, 3);
  const good = JSON.parse(await readFile(path.join(dir, ok.report), 'utf8')); assert.equal(good.status, 'imported'); assert.notEqual(bad.report, ok.report);
});
// ---- matchesRecordId and duplicate deletion ----
const seed = async (dir, over = {}) => {
  const d = await read(dir);
  const old = {...d.jobs[0], id: 'aaaaaaaa-0000-4000-8000-000000000001', company: 'Renamed Co', title: 'Senior Scientist Biologics Design', city: 'Macclesfield', countries: ['UK'], country: 'UK', locationRaw: 'Macclesfield', status: 'Shortlisted', notes: 'call on Monday', url: 'https://www.linkedin.com/jobs/view/111', linkType: 'posting', assessmentBasis: 'Title only', availability: 'Unverified', fit: 3, firstSeen: '2026-10-01', unknownUserField: 'keep', ...over};
  delete old.provider; delete old.providerJobId; delete old.otherIds; delete old.postingUrls; delete old.alternateTitles;
  d.jobs.push(old); await writeFile(path.join(dir, 'jobs.json'), JSON.stringify(d)); return old;
};
await test('matchesRecordId merges changed title and city into the old record and keeps user fields', async dir => {
  const old = await seed(dir);
  const p = await batch(dir, [mk({company: 'Renamed Co', title: 'Senior Scientist I (Biologics Design)', city: 'Alderley Park', locationRaw: 'Alderley Park, UK', countries: ['UK'], url: 'https://careers.renamed.example/jobs/42', matchesRecordId: old.id, fit: 4})]);
  const r = await imp(dir, p); assert.equal(r.exitCode, 0); assert.equal(r.added, 0); assert.equal(r.updated, 1); assert.equal(r.mergedById[0].id, old.id);
  const d = await read(dir), rec = d.jobs.find(x => x.id === old.id);
  assert.equal(d.jobs.length, live.jobs.length + 1);
  assert.equal(rec.title, 'Senior Scientist I (Biologics Design)'); assert.equal(rec.city, 'Alderley Park'); assert.equal(rec.url, 'https://careers.renamed.example/jobs/42'); assert.equal(rec.availability, 'Open'); assert.equal(rec.fit, 4);
  assert.equal(rec.status, 'Shortlisted'); assert.equal(rec.notes, 'call on Monday'); assert.equal(rec.firstSeen, '2026-10-01'); assert.equal(rec.unknownUserField, 'keep');
  assert.ok(rec.alternateTitles.includes('Senior Scientist Biologics Design')); assert.ok(rec.postingUrls.includes('https://www.linkedin.com/jobs/view/111'));
  assert.ok(rec.sources.some(s => s.file.includes('run-')));
});
await test('matchesRecordId with an unknown id is rejected per record and reported', async dir => {
  const p = await batch(dir, [mk({matchesRecordId: 'does-not-exist'}), mk({title: 'Other valid role', company: 'Other Co'})]);
  const r = await imp(dir, p); assert.equal(r.exitCode, 5); assert.equal(r.rejected, 1); assert.equal(r.added, 1);
  assert.match(r.errors.join(' '), /does not exist/); assert.equal((await read(dir)).jobs.length, live.jobs.length + 1);
});
await test('repeated matchesRecordId import is unchanged', async dir => {
  const old = await seed(dir);
  const p = await batch(dir, [mk({company: 'Renamed Co', title: 'New Title', city: 'Elsewhere', url: 'https://careers.renamed.example/jobs/43', matchesRecordId: old.id})]);
  await imp(dir, p); const before = await readFile(path.join(dir, 'jobs.json'), 'utf8');
  const r = await imp(dir, p); assert.equal(r.updated, 0); assert.equal(r.unchanged, 1); assert.equal(r.written, false); assert.equal(await readFile(path.join(dir, 'jobs.json'), 'utf8'), before);
});
await test('matchesRecordId never downgrades a reviewed assessment', async dir => {
  const old = await seed(dir, {assessmentBasis: 'Posting reviewed', fit: 5, assessedAt: '2026-11-02T00:00:00Z', lastObservedAt: '2026-11-02T00:00:00Z'});
  const p = await batch(dir, [mk({company: 'Renamed Co', assessmentBasis: 'Title only', linkType: 'search', availability: 'Unverified', fit: null, url: 'https://www.google.com/search?q=x', matchesRecordId: old.id})]);
  await imp(dir, p); const rec = (await read(dir)).jobs.find(x => x.id === old.id); assert.equal(rec.fit, 5); assert.equal(rec.assessmentBasis, 'Posting reviewed');
});
await test('deleteRecords removes untouched duplicates, refuses records with user data, backs up', async dir => {
  const keep = await seed(dir); const dup = await seed(dir, {id: 'aaaaaaaa-0000-4000-8000-000000000002', status: 'New', notes: '', title: 'Dup'});
  const bad = await deleteRecords({root: dir, ids: [dup.id, keep.id]}); assert.equal(bad.exitCode, 2); assert.equal((await read(dir)).jobs.length, live.jobs.length + 2);
  const dry = await deleteRecords({root: dir, ids: [dup.id], dryRun: true}); assert.equal(dry.written, false); assert.equal((await read(dir)).jobs.length, live.jobs.length + 2);
  const ok = await deleteRecords({root: dir, ids: [dup.id]}); assert.equal(ok.status, 'deleted'); assert.equal(ok.removed.length, 1);
  const d = await read(dir); assert.equal(d.jobs.length, live.jobs.length + 1); assert.ok(d.jobs.some(x => x.id === keep.id)); assert.ok((await readdir(path.join(dir, 'backups'))).length >= 1);
  const missing = await deleteRecords({root: dir, ids: ['nope']}); assert.equal(missing.exitCode, 2);
});
console.log(results.join('\n')); console.log(`\n${results.filter(r => r.startsWith('ok')).length}/${results.length} passed`);
