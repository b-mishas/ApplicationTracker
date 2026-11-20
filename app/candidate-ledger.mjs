// Search-owned state only. This helper never reads or writes the tracker inventory.
import {readFile, mkdir, open, rename, unlink, rmdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash, randomUUID} from 'node:crypto';

const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function keys(value, allowed) {
  if (!object(value) || Object.keys(value).some(key => !allowed.includes(key))) throw Error('Invalid object or unknown fields');
}
function string(value, name, max = 3000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(`Invalid ${name}`);
}
function utc(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT.*Z$/.test(value) || !Number.isFinite(Date.parse(value))) throw Error('Invalid UTC timestamp');
}
function discovery(value) {
  keys(value, ['company', 'title', 'location', 'url', 'provider', 'providerJobId', 'source']);
  for (const field of ['company', 'title', 'location']) string(value[field], field);
  keys(value.source, ['label', 'ref']);
  string(value.source.label, 'source label'); string(value.source.ref, 'source reference');
  if (value.url !== undefined) {
    string(value.url, 'url');
    if (!['https:', 'http:'].includes(new URL(value.url).protocol)) throw Error('Invalid HTTP URL');
  }
  if (value.provider !== undefined || value.providerJobId !== undefined) {
    string(value.provider, 'provider'); string(value.providerJobId, 'providerJobId');
  }
}
// Deliberately conservative: title similarity never merges vacancies. Different known IDs stay distinct.
function identity(value) {
  const parts = value.provider ? ['provider', value.provider, value.company, value.providerJobId]
    : value.url ? ['url', value.url, value.company, value.title, value.location]
      : ['occurrence', value.source.label, value.source.ref, value.company, value.title, value.location];
  return hash(JSON.stringify(parts));
}
function assessment(value) {
  keys(value, ['fit', 'basis', 'reasoning', 'gaps', 'evidence', 'profileRevision']);
  if (value.fit !== null && (!Number.isInteger(value.fit) || value.fit < 1 || value.fit > 5)) throw Error('Invalid fit');
  if (!['Title only', 'Posting reviewed'].includes(value.basis)) throw Error('Invalid assessment basis');
  for (const field of ['reasoning', 'evidence', 'profileRevision']) string(value[field], field);
  if (typeof value.gaps !== 'string' || value.gaps.length > 3000) throw Error('Invalid gaps');
}
function record(value) {
  keys(value, ['schemaVersion', 'id', 'discovery', 'sources', 'discoveredAt', 'updatedAt', 'state', 'reason', 'assessment', 'profileRevision']);
  if (value.schemaVersion !== 1) throw Error('Unsupported ledger version; preserve legacy evidence');
  discovery(value.discovery);
  if (identity(value.discovery) !== value.id) throw Error('Candidate identity mismatch');
  utc(value.discoveredAt); utc(value.updatedAt);
  if (!Array.isArray(value.sources) || !value.sources.length) throw Error('Missing source occurrences');
  for (const source of value.sources) {
    keys(source, ['label', 'ref']); string(source.label, 'label'); string(source.ref, 'ref');
  }
  if (!['pending', 'assessed', 'excluded', 'duplicate'].includes(value.state)) throw Error('Invalid candidate state');
  if (value.state === 'assessed') assessment(value.assessment);
  else if (value.assessment !== undefined) throw Error('Assessment only allowed in assessed state');
  if (['excluded', 'duplicate'].includes(value.state)) string(value.reason, 'disposition reason');
  else if (value.reason !== undefined) throw Error('Reason only allowed for a disposition');
  if (value.profileRevision !== undefined) string(value.profileRevision, 'profileRevision');
}
export async function readLedger(runDirectory) {
  const raw = await readFile(path.join(runDirectory, 'run-ledger.jsonl'), 'utf8');
  const rows = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter(line => line.trim()).map(JSON.parse);
  const ids = new Set();
  for (const row of rows) {
    record(row);
    if (ids.has(row.id)) throw Error('Duplicate ledger identity');
    ids.add(row.id);
  }
  return {revision: hash(raw), rows};
}
export async function initializeLedger(runDirectory) {
  await mkdir(runDirectory, {recursive: true});
  // Exclusive creation never truncates an existing ledger, including a legacy one.
  try { const handle = await open(path.join(runDirectory, 'run-ledger.jsonl'), 'wx'); await handle.close(); }
  catch (error) { if (error.code !== 'EEXIST') throw error; }
  return readLedger(runDirectory);
}
export async function changeLedger(runDirectory, command, input, {beforeRename} = {}) {
  if (!['capture', 'resolve'].includes(command)) throw Error('Unknown mutation');
  keys(input, command === 'capture' ? ['candidates'] : ['revision', 'updates']);
  const entries = input[command === 'capture' ? 'candidates' : 'updates'];
  if (!Array.isArray(entries) || !entries.length || entries.length > 500) throw Error('Expected 1–500 entries');
  const lock = path.join(runDirectory, 'run-ledger.lock');
  // No lock stealing: a crashed writer needs explicit recovery, not an age-based guess.
  await mkdir(lock);
  let temporary;
  try {
    const state = await readLedger(runDirectory);
    if (command === 'resolve' && input.revision !== state.revision) throw Error('Ledger revision changed; read current state before resolving');
    const now = new Date().toISOString();
    const affected = [];
    for (const entry of entries) {
      if (command === 'capture') {
        discovery(entry);
        const id = identity(entry);
        let row = state.rows.find(item => item.id === id);
        if (!row) {
          row = {schemaVersion: 1, id, discovery: entry, sources: [entry.source], discoveredAt: now, updatedAt: now, state: 'pending'};
          state.rows.push(row);
        } else if (!row.sources.some(source => source.label === entry.source.label && source.ref === entry.source.ref)) {
          row.sources.push(entry.source); row.updatedAt = now;
        }
        affected.push(id);
      } else {
        keys(entry, ['id', 'state', 'reason', 'assessment', 'profileRevision']);
        const row = state.rows.find(item => item.id === entry.id);
        if (!row) throw Error('Unknown candidate id');
        if (!['assessed', 'excluded', 'duplicate', 'pending'].includes(entry.state)) throw Error('Invalid transition');
        if (['excluded', 'duplicate'].includes(entry.state)) string(entry.profileRevision, 'profileRevision');
        delete row.reason; delete row.assessment; delete row.profileRevision;
        Object.assign(row, entry, {updatedAt: now});
        affected.push(row.id);
      }
    }
    for (const row of state.rows) record(row);
    const raw = state.rows.map(row => JSON.stringify(row)).join('\n') + '\n';
    temporary = path.join(runDirectory, `run-ledger.${randomUUID()}.tmp`);
    const handle = await open(temporary, 'wx');
    try { await handle.writeFile(raw); await handle.sync(); } finally { await handle.close(); }
    if (beforeRename) await beforeRename();
    // Readers see the old complete file or the new complete file, never a partial batch.
    await rename(temporary, path.join(runDirectory, 'run-ledger.jsonl'));
    return {revision: hash(raw), affected: [...new Set(affected)], total: state.rows.length};
  } finally {
    if (temporary) await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; });
    await rmdir(lock);
  }
}

async function cli() {
  const [command, ...args] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    if (!['--run', '--input', '--state'].includes(args[i]) || !args[i + 1] || options[args[i]]) throw Error('Invalid arguments');
    options[args[i]] = args[i + 1];
  }
  if (!options['--run'] || !['init', 'capture', 'resolve', 'list'].includes(command)) throw Error('Usage: candidate-ledger.mjs init|capture|resolve|list --run DIRECTORY [--input JSON_FILE] [--state pending|assessed|excluded|duplicate|all]');
  const run = path.resolve(options['--run']);
  if (command === 'init') {
    const state = await initializeLedger(run); return {revision: state.revision, total: state.rows.length};
  }
  if (command === 'list') {
    const state = await readLedger(run), filter = options['--state'] || 'pending';
    if (!['pending', 'assessed', 'excluded', 'duplicate', 'all'].includes(filter)) throw Error('Invalid filter');
    return {...state, rows: state.rows.filter(row => filter === 'all' || row.state === filter)};
  }
  if (!options['--input']) throw Error('Mutation requires --input JSON_FILE');
  return changeLedger(run, command, JSON.parse((await readFile(options['--input'], 'utf8')).replace(/^\uFEFF/, '')));
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  cli().then(result => console.log(JSON.stringify(result))).catch(error => { console.error(error.message); process.exitCode = 1; });
}
