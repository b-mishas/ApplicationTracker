// Appends a run's excluded finds to coverage.json `dropped`, so later runs see them as known (ID or URL) or similar (name).
//   called by finish-run.mjs at the end of a run
// Identity: provider job ID or posting URL (company-qualified), else company + title, so two linkless jobs of one
// company stay apart. Already listed jobs are skipped, so a repeated call adds nothing. Entries older than 60 days are
// removed. It rewrites coverage.json, so it runs after the run's last other write to it.
import fs from 'node:fs';
import path from 'node:path';
import {findOf, rowsOf, strongIds} from './capture-check.mjs';
import {normCompany, normTitle} from './import-discoveries.mjs';

const idsOf = d => { const keys = strongIds(d); return keys.length ? keys : [`name:${normCompany(d.company)}|${normTitle(d.title)}`]; };
// droppedAt is the run's date (run-YYYYMMDDHHMM-xxxx), so the 60-day window counts from when the job was seen.
const runDate = (ledger, today) => (path.basename(path.dirname(ledger)).match(/^run-(\d{4})(\d{2})(\d{2})/) || []).slice(1).join('-') || today;

export function recordDropped(root, ledgers, today = new Date().toISOString().slice(0, 10)) {
  const file = path.join(root, 'reports', 'coverage.json');
  const coverage = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
  const cutoff = new Date(Date.parse(today) - 60 * 864e5).toISOString().slice(0, 10);
  const before = coverage.dropped || [];
  const kept = before.filter(e => (e.droppedAt || today) >= cutoff);
  const seen = new Set(kept.flatMap(e => idsOf(findOf(e))));
  const added = [];
  for (const ledger of ledgers) {
    for (const row of rowsOf(ledger)) {
      if (String(row?.state ?? '').trim().toLowerCase() !== 'excluded') continue;
      const d = findOf(row);
      if (!d.company || !d.title) continue;
      const ids = idsOf(d);
      if (ids.some(id => seen.has(id))) continue;
      ids.forEach(id => seen.add(id));
      added.push({provider: d.provider || row.provider || '', providerJobId: d.providerJobId || '', url: d.url || '', company: d.company, title: d.title, reason: String(row.reason || '').slice(0, 150), droppedAt: runDate(ledger, today)});
    }
  }
  coverage.dropped = [...kept, ...added];
  fs.writeFileSync(file + '.tmp', JSON.stringify(coverage, null, 1));
  fs.renameSync(file + '.tmp', file);
  return {added: added.length, removed: before.length - kept.length, total: coverage.dropped.length};
}

