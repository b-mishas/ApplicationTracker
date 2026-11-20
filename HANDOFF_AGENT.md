# Agent handoff

Updated 2026-11-20T19:00Z, Claude. Scope: state-driven orchestration — simplification (committed) and known-find check (uncommitted). main at 03af8a8 [Agent] Simplify search state helpers, on de0abb8 and 72a1467; 6 commits ahead of origin/main, not pushed; remote/CI unverified. No packaging or installed-automation change.

## Committed (03af8a8)

`app/run-state.mjs` reduced to init, task, read, next, summary (manifest schemaVersion 2; v1 files warned about and left alone). Delivery and `summary.inventory.addedThisRun` are read from jobs.json, so the routine uses the plain importer again and reruns an interrupted import. Ledger resolve revision optional. Routine and setup shortened (source = template). Roadmap milestone 5 done.

## Uncommitted

- `run-state next` marks pending candidates of every source that match a jobs.json record of any status, or the coverage.json `dropped` list (provider ID/URL only), as `known` with record id and status. Answers run finding daily-0042-y9k4 (employer finds rated although already Applied/Dismissed).
- Only exclusions resurface after a profile change; duplicates no longer do.
- Routine (source + template identical): capture plus `next` before opening or rating any find; resolve `known` as duplicate unread; alerts use the same check instead of an ad hoc script; resolve assessed candidates stored under another name as duplicate, unrepairable or closed ones as excluded.
- RUN_STATE.md, CANDIDATE_STATE.md, HISTORY.md and ORCHESTRATION_HISTORY.md updated (also fixed a garbled heading there).

## Verification

7 run-state fixture scenarios pass (new: Applied record matched by provider ID across cities, dropped entry, no resurfacing). Full `npm test` exit 0; routine/setup parity and `git diff --check` pass. No agent run on the simplified routine.

## Known limits

Name fallback needs company+title plus location, so aliases or reworded titles are not flagged `known`; the agent must still judge them. Dropped entries without ID or URL never match. Per-source tasks overlap with coverage.json `unfinished` by design. Whether the installed routine is the current one was not checked.

## Next action

User decides on committing the known-find fix. Then milestone 6: multi-posting rehearsal on the intended small models, measuring retained vacancies, summary accuracy and native tokens with and without the helpers. No active operations.
