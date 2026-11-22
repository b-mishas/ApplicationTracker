# Agent handoff

Updated 2026-11-22T00:45Z, Claude. Scope: cheaper resume for `run-state.mjs` after the milestone 8 rehearsal and Codex's review, then a capped stress test. The resume fix below is committed on main, 3 commits ahead of origin/main. Nothing pushed, remote/CI unverified. `design/` is unrelated untracked work. No packaging or installed-automation change.

## Done

- Milestone 8 evidence, Codex's review and the docs were committed in 424e607. Results: equal retention, no duplicate imports, the helper avoided rating known vacancies, and it cost 15% more, mostly on resume. [Report](rehearsal/runs/2026-11-21-handoff-recovery/evaluation/REPORT.md) and [Codex review](rehearsal/runs/2026-11-21-handoff-recovery/evaluation/CODEX_REVIEW.md) are Git-ignored evidence.
- Resume fix:
  - `init` continues today's unfinished run (`resumed: true`, same ID and batch name; its open finds are in `carried`).
  - Capture and resolve record their inputs in the manifest, and `init`/`next` list `uncaptured` result files in unfinished run folders.
  - `summary` ends the run and any earlier unfinished one.
  - The routine (source = template) continues a resumed run from source-evidence.jsonl, retries only under the retry rules, captures uncaptured find lists and rates from saved extracts.
  - RUN_STATE.md, the roadmap's next action, ORCHESTRATION_HISTORY and HISTORY are updated.

## Verification

9 run-state fixture scenarios pass, including same-day resume with uncaptured files and a next-day listing closed by a summary. Full `npm test` exit 0; prompt parity and `git diff --check` pass. No agent run on this version.

## Known limits

- A run that calls `summary` early is treated as finished, so a later same-day session starts a new run, with its finds carried.
- Posting extracts captured by mistake are harmless, because capture is idempotent.
- Whether the carry-over beats a plain ledger after an unannounced stop is unmeasured.

## Next action

Capped stress test (about $5 CLI cost in total), delegated to the [m8 rehearsal session](#local_4b615931-eac3-414c-a38b-ce2f82f5e90a):
- Arms: one combined scenario per arm on the same base, with state handling as the only difference.
- Fixture: several sources with aliases, a same-title requisition, an out-of-scope role, partial pagination, a transient failure and a due refresh.
- Interruption: an unannounced kill once a subagent result file is saved, then a next-day run with the normal prompt.

Then decide whether to keep the carry-over or shrink to the capture check. Active operation: that rehearsal session, once started.
