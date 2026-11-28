# Agent handoff

Updated 2026-11-28T07:49:23Z — Claude.

## Scope and checkout

The user asked for M7 recovery simplification (ROADMAP_SETUP.md), followed by fixes for Codex's review; no commit, push or distribution rebuild. Main is at 4931d22, tracking origin/main; remote and CI are unverified. Codex's concurrent wrapper port is uncommitted in the same checkout (see HANDOFF_WRAPPER.md), and both sets of changes are intact. The untracked design/ folder was left alone. No personal data, task or live run was touched.

## Implemented (uncommitted)

- app/finish-run.mjs `previousRetry`:
  - runs are ordered by manifest startedAt (folder names only as a fallback; at equal times an unfinished folder counts as later);
  - the carry is the newest valid finish.json retry list plus due sources of later unfinished folders;
  - a source counts only when checked in the latest run that selected it or later;
  - a completed setup reset drops only the carried sources it replayed.
  finishRun keeps unchecked inherited employer/portal items.
- app/setup-progress.mjs derives progress from the latest run (validated, unambiguous), the carried retry list, workbook/coverage/Gmail/portal checkpoints, coverage unfinished work, open finds and takeovers.
  - Takeover checks finds in JSON and JSON-lines result files.
  - Other non-empty files need the taker's `reviewed` list.
  - Legacy empty receipts must still be empty.
- setup-state.mjs: the source-work, select-sources and classify-orphan commands are removed.
- Routine and pristine copies: no source-work or select-sources step and no millisecond selection rule. `takenOverBy` marks taken-over runs; carried items persist until checked.
- Tests: app/test-recovery-outcomes.mjs has 24 scenarios (21 shared, 3 compatibility).
- scripts/compare-recovery-baseline.mjs reproduces the reference comparison from Git.
- Docs aligned: SETUP_PROMPT, CUSTOMIZE, SETUP_WORKFLOW, SEARCH_WORKFLOW, INTERFACE, orchestration roadmap invariants, ROADMAP_SETUP, PLAN and both histories.

## Verification

- Current design: 24/24 scenarios pass. The 9 regressions for Codex's review fail on the pre-fix version.
- Reference 4931d22: 3 MUST and 5 SHOULD failures across the 21 shared scenarios.
- Full `npm test`: exit 0.
- Everything is fixture-only.

## Limits and next action

Limits:
- Portals absent from coverage.json are not detected.
- A check within a run is assumed to satisfy that run's own selections.

Next actions:
- Codex re-review closes M7.2/M7.3.
- Then the M7.4 attended rehearsal. The proposal is Sonnet 5.5, a USD 5 cap and a fictional isolated installation; it is not yet approved.
- Commit the M7 work separately from the wrapper port.

No active operations.
