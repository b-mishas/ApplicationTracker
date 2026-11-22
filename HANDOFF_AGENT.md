# Agent handoff

Updated 2026-11-22T01:30Z, Claude. Scope: trim `run-state.mjs` to break even with a plain ledger (roadmap milestone 11) after milestones 8 and 10. The milestone 10 docs and the milestone 11 changes below are committed on main, 4 commits ahead of origin/main. Nothing pushed, remote/CI unverified. `design/` is unrelated untracked work. No packaging or installed-automation change.

## Evidence so far

- **M8** ([report](rehearsal/runs/2026-11-21-handoff-recovery/evaluation/REPORT.md)): the helper arm cost 15% more, mostly on resume.
- **M10** ([report](rehearsal/runs/2026-11-22-stress-recovery/evaluation/REPORT.md), an unannounced kill plus a next-day run on 7d2529c): equal outcomes, with the helper 12% more. The extra came from larger tool output in the lead's context, not from extra turns.
- Both reports are Git-ignored evidence.
- **Cost composition** across M6/M8/M10: cache writes 41–49%, cache reads 26–34%, output 21–25%. Details are in ORCHESTRATION_HISTORY.

## Changed

- `app/run-state.mjs`:
  - `capture` on the command line prints one compact line per find plus a note, and reports finds already decided in the current run.
  - `init` moves open finds of earlier runs into the current run (`carriedIn`), so carried work is decided without `--run`.
  - `summary` adds `ratedThisRun` (by basis, excluding carried ratings) and `sources` (per kind and status from source-evidence.jsonl).
- Routine (source = template, 43.6k characters):
  - no printing of captured files and no RUN_STATE.md read;
  - filtered reads of saved files;
  - independent lead tool calls grouped in one turn;
  - `kind` and `status` in each evidence line;
  - counts taken from the summary.
- Docs: RUN_STATE.md, roadmap (milestones 9–12, next action), ORCHESTRATION_HISTORY, HISTORY.

## Verification

10 run-state fixture scenarios pass. Full `npm test` exit 0; prompt parity and `git diff --check` pass. No agent run on this version.

## Known limits

- Real runs are Claude desktop scheduled tasks or Codex automations, not the CLI, so cache lifetime and pricing there are unmeasured.
- A carried rating re-rated today still counts as carried.
- A `summary` called early ends the run.

## Next action

Milestone 12, the break-even check: repeat M10's pair on this base, with the general output rules in both arms and a cost cap. Start it in a new session from a short brief, not the M8 session. Codex has not reviewed the M10 verdict. No active operations.
