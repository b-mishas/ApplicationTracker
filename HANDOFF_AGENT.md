# Agent handoff

Updated 2026-11-20T21:50Z, Claude. Scope: slim the search state helper after the milestone 6 rehearsal and Codex's review, plus three fixes from Codex's code review. main at a341f34 (Wrapper commits by another assistant on top of 232d5ed), level with the local origin/main ref; remote/CI unverified. The slim helper below is **uncommitted**. `design/` is unrelated untracked work. No packaging or installed-automation change.

## Changed (uncommitted)

- `app/run-state.mjs` v3, the agent's only state helper: `init` (generates the run ID, writes `data/reports/runs/CURRENT`, prints run folder, batch file name and carried finds with saved fit/reasoning), `capture` (accepts subagent JSONL as written; saves first, then auto-resolves finds sharing a provider ID or URL with any jobs.json record or dropped entry as duplicate; returns new / known / similar / decidedBefore with 8-character ids), `resolve` (flat decisions, short ids, profile hash added), `summary`, `next`. `--root` defaults to `data`. Task list, `task`/`read`, scope fields removed; v2 manifests still readable.
- Codex review fixes: delivery needs a shared provider ID or URL (name match only for finds with neither; otherwise carried as `similar`); rediscovered vacancies keep one open entry (decision copied to today, earlier rows become duplicates); `resolve` requires explicit basis and, for Posting reviewed, evidence.
- Routine and setup (source = template): command lines inline, one resolve per rating round, coverage counts from source-evidence.jsonl and unfinished work in coverage.json, postings delegated from three up. Routine 41.4k → 42.3k characters.
- RUN_STATE.md rewritten; CANDIDATE_STATE.md, SEARCH_WORKFLOW.md, INTERFACE_FOR_TRACKER.md aligned. Roadmap amended (invariants, milestone 7 done, milestone 8 next); ORCHESTRATION_HISTORY, HISTORY and PLAN updated.

## Verification

8 run-state fixture scenarios pass, including the three Codex review cases, CLI end to end, known/similar/dropped/other-employer IDs, rejected and ambiguous imports carried, repeated import, interruption resume reusing earlier decisions, profile change and read-only summary. Full `npm test` exit 0; prompt parity and `git diff --check` pass. No agent run on this version.

## Known limits

Name-only matches are returned as `similar`, not skipped, so aliases and reworded titles still need the agent's judgment. Dropped entries without ID or URL never match. Whether the slim version recovers the 57% overhead is an estimate, not measured. The installed scheduled routine was not checked or changed.

## Next action

User decides on committing (`[Agent]`). Then roadmap milestone 8: a hand-off and recovery rehearsal (same reader model and delegation in both arms, delegated employer batch with known vacancies under alternate URLs/IDs, interruption after assessment) against b66c262, reusing `rehearsal/runs/2026-11-21-small-model-acceptance/evaluation/run-arm.mjs`. No active operations.
