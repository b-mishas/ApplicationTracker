# Run state contract (version 2)

`run-state.mjs` keeps the live `run-completion.json` task list, finds unfinished work across run folders and derives summary counts. It complements [CANDIDATE_STATE.md](CANDIDATE_STATE.md). It never writes inventory, browses, decides relevance, schedules work or advances coverage dates. Imports use the normal importer in [SEARCH_WORKFLOW.md](SEARCH_WORKFLOW.md).

## Commands

From ROOT, with the same Node as the importer. `--root` is the data folder; `--run` is the run-folder name under `data/reports/runs/`, not a path. `--input` is a UTF-8 JSON file (BOM accepted). Output is JSON; exit 1 means failure with a message.

```text
node app/run-state.mjs init    --root data --run <run-id> [--input <run-folder>/plan.json]
node app/run-state.mjs task    --root data --run <run-id> --input <run-folder>/tasks.json
node app/run-state.mjs next    --root data [--run <run-id>]
node app/run-state.mjs summary --root data --run <run-id>
node app/run-state.mjs read    --root data --run <run-id>
```

## Init

Run before the first external call. It creates the run folder, an empty candidate ledger if none exists, and the manifest with the current profile hash. It never overwrites an existing manifest. All input is optional:

```json
{"scope": {"sources": ["*"], "exclusions": [{"source": "LinkedIn", "reason": "User excluded LinkedIn for this run"}]},
 "tasks": [{"id": "employer:Example", "kind": "employer", "source": "Example", "status": "pending"}]}
```

`sources` defaults to `["*"]` (the profile's normal sources). Exclusions apply to this run only; they never become profile rules.

## Tasks

`task` takes one task object or `{"tasks": [...]}`. A new id is added; an existing id is replaced. Send only the fields you know:

- `id`, `kind`, `source`, `status` are required. Kinds: alerts, posting, refresh, employer, portal, gap, recheck, import, coverage, summary. Statuses: pending, active, done, partial, deferred, failed, not_due, excluded.
- `evidence` is required for done (for example the source-evidence line). `reason` is required for partial, deferred, failed, not_due and excluded. `nextAction` is required for partial, deferred and failed, so the next run knows where to continue.
- `cursor` is an optional short continuation hint (for example `page=3`). Listings change: resume with overlap and deduplicate.

Update a task when a source finishes or stops, not after every call. Keep full results in the ledger and `source-evidence.jsonl`, not in task text.

## Next

`next` scans every run folder and returns, per run, unfinished tasks and candidates that still need work: pending ones, assessed ones not yet in the inventory, and exclusions decided under an older profile (a duplicate points at a record or candidate that is reassessed itself). A pending candidate that matches an inventory record of any status, or an entry of the `dropped` list in `coverage.json`, carries `known`: `{"record": "<id>", "status": "Applied"}` or `{"status": "dropped", "reason": "..."}`. Resolve it as duplicate without reading or rating it. With `--run`, it also flags `profileChanged` and marks items whose source is excluded today (`excludedNow`). Unreadable or older-format files are listed under `warnings` and left untouched.

Delivery is read from `jobs.json`: an assessed candidate counts as stored, and a pending one as known, when an inventory record of the same company shares its provider ID or posting URL or, failing that, has the same normalised title and a matching location. Dropped entries carry no location, so they match by provider ID or URL only. A candidate the importer rejected or marked ambiguous therefore stays in `next` until it is repaired and imported, or resolved as duplicate or excluded. Inspect saved candidates before repeating a search; reuse assessments only when the profile has not changed.

## Summary

Run `summary` before writing the final summary. It is read-only and returns:

- `candidates`: this run's ledger by state.
- `tasks`: counts by kind and status, zeros included.
- `inventory.addedThisRun`: every inventory record whose first source is this run's batch, including candidates captured in earlier runs. Because it is read from the inventory, an interrupted or repeated import does not change it. `touchedThisRun` counts all records carrying this run's batch.
- `importReports`: each importer report for this run's batch with counts, `reportError` and the ambiguous/rejected records still to repair. A retry overwrites the previous report, so use `addedThisRun` for additions.
- `unfinishedTasks` and `outstanding` (the `next` result).

Task statuses are declared by the agent; source coverage still needs source evidence. Report metrics not recorded anywhere as unknown, never as zero.

## Safety and retention

One lead process writes the manifest and ledgers; subagents return result files. Writes use an atomic replace under an exclusive `run-state.lock` directory. Never remove a lock while its writer may be active. All run folders are kept; there is no deletion command.
