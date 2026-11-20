# Agent handoff

Updated 2026-11-20T18:10Z, Claude. Scope: simplify Codex's state-driven orchestration after review. main: Codex's work is 72a1467 [Agent] Add state-driven search orchestration, the prefix rule de0abb8, and this simplification is committed on top as [Agent] Simplify search state helpers; 6 commits ahead of origin/main, not pushed; remote/CI unverified. No packaging or installed-automation change.

## Changed

- `app/run-state.mjs`: only init, task, read, next, summary. Removed manifest/ledger revision requirements, call budgets, deadline, stop/context/resume and prepare/import/reconcile/receipt. Manifest schemaVersion 2; v1 files are warned about and left as they are. Task text fields default to empty; nextAction is required only for partial/deferred/failed.
- Delivery comes from jobs.json (same-company provider ID or posting URL, else company+title with location). `summary.inventory.addedThisRun` = records whose first source is this run's batch, so additions stay correct after retries; `importReports` lists counts and records to repair.
- `app/candidate-ledger.mjs`: resolve revision optional.
- `app/RUN_STATE.md` rewritten (~60 lines); `CANDIDATE_STATE.md`, `SEARCH_WORKFLOW.md` and `INTERFACE_FOR_TRACKER.md` aligned.
- Routine (source + template identical): direct importer restored, interrupted import = rerun; state/summary rules shortened; the "always four sections" vs "omit if empty" contradiction fixed. 43.8k → 41.4k characters.
- Setup (source + template identical): capture starts with `run-state init`; dead text after COPY UNTIL HERE removed.
- Roadmap: design amended, milestone 5 (simplification) done, milestone 6 (small-model acceptance) next. ORCHESTRATION_HISTORY, HISTORY and PLAN updated; dangling COMPACTION.md links fixed (user deleted the file).

## Verification

Ledger tests and 6 run-state fixture scenarios pass, including a provider-ID collision with another employer (bug found and fixed while drafting). Full `npm test` passed (exit 0); source/template parity and `git diff --check` passed. No agent rehearsal ran on the simplified routine.

## Known limits

Name-based delivery fallback can miss aliases or reworded titles; those candidates stay visible in `next`. Per-source tasks still overlap with coverage.json `unfinished`, which was kept deliberately: the tasks feed the derived employer/portal counts.

## Next action

Milestone 6: a multi-posting rehearsal on the intended small models, measuring retained vacancies, summary accuracy and native tokens against a run without the helpers. No active operations.
