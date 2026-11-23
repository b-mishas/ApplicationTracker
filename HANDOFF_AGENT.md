# Agent handoff

Updated 2026-11-23, Claude. Scope: Codex's P2 fix (merged URLs) and use logs (former PLAN.md item 4). main at ac8fa4b, 8 commits ahead of origin/main (not pushed); both changes below are uncommitted; remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Codex review of 6412d4c and ac8fa4b

Verdict: the earlier P1 is resolved; no new silent-loss blocker. Details are in [ORCHESTRATION_HISTORY.md](agent/orchestration/ORCHESTRATION_HISTORY.md).

- **P2, fixed (uncommitted):** `open()` in `app/capture-check.mjs` keeps every ID and URL per vacancy and checks each against jobs.json, so a find imported under an older URL is no longer listed as open. The regression test fails on ac8fa4b.
- Codex's other answers need no code: same-run duplicates stay listed by design; suffix normalisation is optional cleanup.

## Use logs (uncommitted)

- **Routine (Part B, end of §11):** save `summary.md` and `run-log.json` in the run folder. The log holds assistant, models, times, access (gmail, browser, subagents), checklist items 1–7, subagents per kind, and errors without URLs, names or job details.
- **Setup:** after each step, update `data/reports/setup-log.json` (step, status, note).
- **`app/diagnostics.mjs [--runs N]`:** writes `data/exports/diagnostics-<UTC>.json` with the setup log and the last runs: statuses, ledger and source counts, import counts, and errors with URLs, emails and paths masked. It sends nothing.
  - shortcut: a company name the agent writes into an error text is not masked; the routine forbids writing one.
- **Wrapper side:** `app/test-diagnostics.mjs` in npm test, and the script in the build-release list (HANDOFF_WRAPPER notes both). START_HERE.html has a "Problem report" copy block.
- Token cost is not included, because the agent cannot measure it.

## Verification

- Full `npm test` exit 0 (capture-check, diagnostics, drift test).
- The diagnostics test seeds private strings (profile, company, title, email, URL, path, summary) and checks that none reach the bundle.
- The CLI was run end to end on a throwaway copy.
- `git diff --check`.
- No agent run, so no real run-log or setup-log exists yet.

## JobTracker

- It has the same P2 (reproduced at b69d46e), reported in `C:/Users/misha/Claude/Code/JobTracker/BUGS.md`.
- Its earlier BUGS.md items are fixed there (b69d46e).
- The use logs are not ported to JobTracker.

## Release and rehearsal

- dist/ is still built from 330274f; rebuild right before the next rehearsal or publication.
- The rehearsal task's ROOT names a folder that no longer exists.

## Next action

Commit when the user asks (P2 fix and use logs as separate commits); a Codex review of both; then the next rehearsal. No active operations.
