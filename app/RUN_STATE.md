# Run state contract (version 3)

`run-state.mjs` is the search agent's one state helper. It starts a run, saves every find before it is read or rated, marks finds the tracker already has, saves decisions, and derives summary counts. It reads `jobs.json` and the `dropped` list in `coverage.json` but never writes them; imports use the normal importer in [SEARCH_WORKFLOW.md](SEARCH_WORKFLOW.md). Storage and identity rules are in [CANDIDATE_STATE.md](CANDIDATE_STATE.md).

## Commands

Run from ROOT with the same Node as the importer. `--root` defaults to `data`. Every command except `init` works on the current run (named in `data/reports/runs/CURRENT`); `--run <run-id>` selects another run folder. Output is one JSON line; exit 1 means failure with a message.

```text
node app/run-state.mjs init
node app/run-state.mjs capture --input <file> [--input <file> ...]
node app/run-state.mjs resolve --input <file>
node app/run-state.mjs summary
node app/run-state.mjs next
```

## init

Run once, before the first external call. It creates `data/reports/runs/<run-id>/` with the candidate ledger and a manifest (`runId`, `startedAt`, profile hash), makes it the current run and never overwrites an existing run. It prints `runId`, the run `folder`, the `batch` file name to use for this run's import, and `carried`: finds from earlier runs, including setup captures, that still need work (pending, assessed but not in the inventory, or excluded under a different profile, marked `reassess`). Assessed ones include fit, reasoning and gaps, so they can go into today's batch without another read. A find counts as stored only when an inventory record shares its provider ID or posting URL (or, for a find with neither, its company, title and location); a find that matches a record by name alone is carried with `similar` naming that record. `warnings` lists unreadable ledgers; they are left untouched.

## capture

Pass one or more files: subagent result files as written (JSONL, one find per line), a JSON array, or `{"candidates": [...]}`. Each find needs `company` and `title`; `location` (default `Unknown`), `url`, `provider` with `providerJobId`, and `source` (a label, or `{label, ref}`; default the file name) are used when present. Other fields are ignored.

It saves all finds first, then returns them in four groups:

- `known`: same company and the same provider job ID or posting URL as an inventory record of any status, or as a dropped entry. Saved as duplicate (`r5 (Applied)`, `dropped: <reason>`); do not read or rate them.
- `decidedBefore`: assessed or excluded in an earlier run under the current profile. The decision is copied onto today's entry; reuse it without another read.
- `similar`: same company, title and location as an inventory record, but no shared ID or URL. Decide yourself whether it is the same vacancy.
- `new`: everything else. Read, rate or drop these.

Each find has a short `id` (8 characters) for `resolve`. Earlier entries of a captured vacancy are marked as duplicates of today's, so every vacancy has one open entry.

## resolve

Input is a JSON list of decisions, one per find:

```json
[{"id": "1a2b3c4d", "state": "assessed", "basis": "Posting reviewed", "fit": 4, "reasoning": "Java and SQL match", "gaps": "No Kafka", "evidence": "Java 17 and SQL essential"},
 {"id": "5e6f7a8b", "state": "excluded", "reason": "Sales role"},
 {"id": "9c0d1e2f", "state": "duplicate", "reason": "Same as r12"}]
```

`assessed` needs `basis` and `reasoning`. With basis `Posting reviewed` it also needs `evidence`: the posting lines the rating rests on. Use `Title only` when the posting was not read. `fit` and `gaps` are optional. Nothing is filled in by default, so incomplete input is rejected while the source is still at hand. `excluded` and `duplicate` need `reason`. `pending` reopens a find. The profile hash is added automatically. Resolve carried finds with `--run` set to the run they came from. Assessed means rated, not imported.

## summary

Read-only. Run it before writing the final summary:

- `candidates`: this run's finds by state.
- `addedThisRun`: every inventory record whose first source is this run's batch. It is read from the inventory, so a repeated or interrupted import does not change it. `touchedThisRun` counts all records carrying this run's batch.
- `importReports`: each importer report for this run's batch with counts and the ambiguous or rejected records still to repair.
- `carriedFromEarlierRuns` and `warnings`.

Source coverage (employers, portals, alerts) is not derived here; take it from `source-evidence.jsonl` and `coverage.json`. Report metrics recorded nowhere as unknown, never as zero.

## next

Prints the `carried` list again without starting a run.

## Safety and retention

One lead process writes state; subagents only write result files. Ledger writes use an atomic replace under an exclusive lock directory; never remove a lock while its writer may be active. All run folders are kept; there is no deletion command. Manifests from version 2 are still readable; their task lists are ignored.
