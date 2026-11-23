# Agent handoff

Updated 2026-11-23, Claude. Scope: capture check as the search agent's state handling (roadmap milestone 13), the fixes for Codex's implementation review, and a routine wording fix (posting delegation threshold). main: milestone 12 docs in 299bc17, milestone 13 in 500417a, threshold fix in d6e1cbe, stale `addedThisRun` summary reference removed in e13ae54; not pushed; remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change. A porting guide for the personal JobTracker routine is in that checkout (`C:/Users/misha/Claude/Code/JobTracker/SEARCH_PORTING.md`, pinned to e13ae54), not here.

## Evidence

- [Milestone 12 report](rehearsal/runs/2026-11-22-three-arm-break-even/evaluation/REPORT.md) (Git-ignored) and Codex's two reviews in [ORCHESTRATION_HISTORY.md](agent/orchestration/ORCHESTRATION_HISTORY.md).

## Changed (committed)

- `app/capture-check.mjs` (read-only):
  - `<file>`: `known`/`similar`/`new` per find against jobs.json and the dropped list.
  - `--open [<ledger>]`: profile hash, then finds of all runs (newest entry per vacancy) that are pending, without state, assessed but not imported, decided under another profile (`reassess`), in an unknown state, or in an unreadable ledger.
- `app/test-capture-check.mjs`; `package.json` test and `scripts/build-release.mjs` list (wrapper-owned; HANDOFF_WRAPPER notes it).
- Routine and setup (agent/ and templates/, identical): `--open` at start for all runs; resume only today's unfinished run; `profile` saved in run-completion.json; four allowed ledger states; open check before the summary.
- Removed run-state.mjs, candidate-ledger.mjs, their tests and contracts (recoverable from 92e1d73).
- Docs: INTERFACE_FOR_TRACKER, SEARCH_WORKFLOW, AGENTS/CLAUDE example, roadmap (design sections, milestones 12–13, next action), both histories.

## Verification

capture-check tests pass; full `npm test` exit 0; prompt parity; `git diff --check`. On milestone 12 plain-ledger evidence `--open` lists NK-24388 and an invented state. No agent run on this version.

## Known limits

- The open check is prose-enforced. After a profile change every older exclusion is listed as `reassess` (shortcut in the script).
- Real runs are Claude desktop scheduled tasks or Codex automations; cache and pricing unmeasured.

## Next action

Push when the user asks. Then the profile-template location question (hard limit vs preference), and observe 2–3 ordinary scheduled searches. No active operations.
