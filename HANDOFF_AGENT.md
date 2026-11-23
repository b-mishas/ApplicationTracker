# Agent handoff

Updated 2026-11-23, Claude. Scope: fixes for Codex's review of a311937–ee6ec38 (P1 committed in 6412d4c) and for two gaps JobTracker's review found (uncommitted). main at 6412d4c, 7 commits ahead of origin/main (not pushed); remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Codex review (2026-11-23)

Verdict: directionally sound, one P1. Its details are in [ORCHESTRATION_HISTORY.md](agent/orchestration/ORCHESTRATION_HISTORY.md), in the entry "Codex review of a311937 through ee6ec38".

- **P1, fixed in 6412d4c:** a `repeat` written as a duplicate ledger line replaced the open find it repeated, so `--open` reported nothing to do.
  - The routine and setup (with their templates) now add a repeat's source to the existing ledger line.
  - `app/capture-check.mjs` `open()` keeps the earlier entry's state when a duplicate line repeats a vacancy already in the same ledger. A later run's duplicate decision still closes it.
  - INTERFACE_FOR_TRACKER notes the rule.
- **Not code:** a small model's `text: full` is self-reported; watch it in runs.

## JobTracker review gaps (uncommitted)

- `slotFor`: a line without ID or URL joins only a single keyless entry, never an identified one; merges keep known identifiers.
- `sameCompany`: whole-word comparison (Roche Diagnostics = Roche, Rochester Biotech ≠ Roche).
- Tests added; the identity test fails on 6412d4c.

## Verification

- New tests (pending plus repeat, rated-not-imported plus repeat, imported plus repeat, a later run's decision) fail on ee6ec38's script and pass now.
- Full `npm test` exit 0; drift test; `git diff --check`.
- No agent run.

## JobTracker

It has the same bug, reproduced with its `scripts/capture-check.mjs` at fec635d. Its installed Cowork task (Fridays 17:15 Berlin) runs the affected prompt. Reported in `C:/Users/misha/Claude/Code/JobTracker/BUGS.md`; JobTracker itself is unchanged.

## Release and rehearsal

- dist/ was built from 330274f and lacks ee6ec38 and the fixes since; the user said not to rebuild yet.
- This package has no installed routine. The rehearsal task's ROOT names a folder that no longer exists.

## Known limits

The finish and reassess rules are prose-enforced; a LinkedIn alert and the employer posting of one job are only `similar` (PLAN.md 2 and 3).

## Next action

Commit the JobTracker-review fixes when the user asks; then rebuild dist/ and push when asked. No active operations.
