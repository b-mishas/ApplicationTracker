# Candidate capture contract (version 1)

This helper preserves discoveries and assessments. It does not itself import jobs, mark deliveries complete, schedule work or certify source coverage. [RUN_STATE.md](RUN_STATE.md) describes the companion helper for cross-run recovery and import receipts. Existing inventory/import contracts remain unchanged.

## Commands

Run from ROOT with the same Node executable as the tracker:

```text
node app/candidate-ledger.mjs init --run data/reports/runs/<run-id>
node app/candidate-ledger.mjs capture --run data/reports/runs/<run-id> --input <capture-file.json>
node app/candidate-ledger.mjs list --run data/reports/runs/<run-id>
node app/candidate-ledger.mjs resolve --run data/reports/runs/<run-id> --input <updates-file.json>
node app/candidate-ledger.mjs list --run data/reports/runs/<run-id> --state assessed
```

`--run` selects the existing setup/routine evidence folder; `init` creates it if necessary and never truncates a ledger. `--input` reads UTF-8 JSON (BOM accepted). `list` defaults to pending; `--state` also accepts assessed, excluded, duplicate or all. Output is JSON; exit 1 means failure. Store input files inside the run folder. Call the helper serially from the lead; delegated readers return input artifacts, not concurrent ledger edits. Use explicit paths under ROOT, not arbitrary external directories.

## Capture before selection

Initialize before the first posting read or live discovery during setup. Save each result page/batch before selecting candidates for deeper reading, changing source or making a potentially blocking browser call. Include candidates that will be excluded or recognized as duplicates; give them dispositions afterward. This only protects extracted data: the helper cannot detect a vacancy omitted from the supplied input.

```json
{"candidates":[{"company":"Example","title":"Backend engineer","location":"Berlin","url":"https://example.test/jobs/123","provider":"Example ATS","providerJobId":"123","source":{"label":"Employer board","ref":"page1:item123"}}]}
```

Company, title, location and source label/ref are required nonempty strings (use `Unknown` for genuinely unknown location). URL is optional but must be HTTP(S) when present. Provider and providerJobId are optional together. Unknown fields are rejected. Up to 500 candidates can be captured in one atomic call; split larger result sets into saved input batches.

Identity is a SHA-256 digest of exact provider/company/requisition ID when known, otherwise exact URL plus company/title/location (shared search URLs must not collapse distinct roles), otherwise source occurrence plus company/title/location. Different known IDs stay distinct. Similar titles are never automatically merged. URL wrappers, employer aliases and later identity enrichment can create separate candidates; resolve confirmed duplicates with a reason naming the retained candidate or inventory ID. Do not claim the identity scheme solves semantic deduplication.

Repeated capture merges new source occurrences but never resets a disposition/assessment or silently overwrites the initial discovery. For a material change or changed profile, explicitly return the candidate to pending before reassessment. `capture` returns affected IDs, total and the current revision without printing the whole ledger.

## Ledger and transitions

Each line in `run-ledger.jsonl` is a validated version-1 record: `schemaVersion`, `id`, original `discovery`, `sources`, system-clock `discoveredAt`/`updatedAt`, `state`, and an assessment or disposition reason when applicable. The helper is the validator; do not hand-edit the ledger. Unknown/legacy formats fail closed and remain intact; no automatic migration is provided.

States are pending, assessed, excluded and duplicate. Any state can be explicitly revised with the current ledger revision, including reopening as pending. Reads return a SHA-256 revision; pass it to resolve to reject stale decisions after another write. Each resolve call either updates all entries or none.

```json
{"revision":"<revision from list>","updates":[{"id":"<candidate id>","state":"assessed","assessment":{"fit":4,"basis":"Posting reviewed","reasoning":"Core skills match","gaps":"Office days unknown","evidence":"Concise requirements/responsibilities and availability evidence, with source reference; not a page dump.","profileRevision":"<hash of approved profile>"}}]}
```

Fit is null or an integer 1–5; basis is Title only or Posting reviewed. Reasoning, evidence and profileRevision must be nonempty; gaps may be empty. Save the facts needed to reuse the assessment, including an actual reading failure for Title only. Before profile approval during setup, leave candidates pending; save calibration assessments after approval and tag them with the actual profile revision. If the profile changes, reassess against it rather than blindly reuse old ratings.

Excluded/duplicate updates require `reason` and the current `profileRevision`; older decisions without a revision remain readable but are flagged for review by run-state. Pending updates contain only id/state. Assessment fields and reasons inappropriate to the target state are rejected. Assessed means reusable judgment, not batch-ready or imported. Build schema-valid batches separately using the saved discovery and assessment; import validation remains mandatory. Do not infer delivery from this ledger.

## Setup handover and retention

Keep the setup capture folder when starting the first routine. Pass its path into the routine conversation and list its pending/assessed candidates; do not copy or recapture them merely to obtain a new run ID. The routine's current run can reference that folder and update its ledger through the helper. If the path was lost, inspect setup run folders explicitly; run `run-state next` as described in RUN_STATE.md to discover old captures automatically.

Preserve all ledger folders for now, including assessed candidates awaiting import and legacy evidence. The run-state helper reconciles delivery from receipts; automatic deletion remains disabled. A run ending or becoming old is not evidence that its candidates were delivered.

## Write safety

The helper validates the whole update in memory, writes and syncs a temporary file beside the ledger, then renames it over the ledger. An exclusive `run-ledger.lock` directory prevents overlapping writers; locks are never stolen. An ordinary failure cleans temporary files and releases its lock. A killed process may leave a lock/temp file: preserve evidence, confirm no writer remains, and obtain deliberate recovery before removing a stale lock. No automated lock recovery is provided. This is process-interruption protection, not a guarantee against every filesystem or power failure.
