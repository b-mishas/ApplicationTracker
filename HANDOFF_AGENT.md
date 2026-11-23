# Agent handoff

Updated 2026-11-23, Claude. Scope: capture check (roadmap milestone 13) and the five fixes from Codex's review of JobTracker's port (BUGS.md). main at 08e4e0c, pushed by the user; the fixes below are uncommitted; remote/CI unverified. `design/` is unrelated untracked work; `PLAN.md` has uncommitted plan updates. No installed-automation change.

## Changed (uncommitted)

- `app/capture-check.mjs`:
  - CLI exits 2 without `data/jobs.json`, and `--open` also without the profile.
  - `--seen <run-ledger.jsonl>`, plus matching within one call, prints `repeat` for the same vacancy from another source.
  - `--open` keeps a find that gains an ID or URL as one vacancy; different IDs stay separate.
- `app/test-capture-check.mjs`: scenarios for each of the above. They fail on 08e4e0c's script.
- Routine and setup (agent/ and templates/, identical):
  - stop on a check error at start;
  - check with `--seen` before adding finds to the ledger, and keep both sources of a `repeat`;
  - `reassess` overrides a dropped-list `known`;
  - a later-found ID or URL may be added to a ledger line;
  - the finish check covers all runs.
- INTERFACE_FOR_TRACKER, SEARCH_WORKFLOW, both histories.
- BUGS.md (from the forked session) is marked fixed.

## Verification

Full `npm test` exit 0; prompt and setup parity; `git diff --check`. No agent run on this version.

## Known limits

- The finish and reassess rules are prose-enforced.
- LinkedIn alert URLs and employer URLs differ, so that pair is only `similar`.
- After a profile change every older exclusion is listed as `reassess`.

## Elsewhere

JobTracker's own port and its fixes are in `C:/Users/misha/Claude/Code/JobTracker` (SEARCH_PORTING.md, scripts/capture-check.mjs), uncommitted there. They differ from these fixes in one detail of the ID transition (see ORCHESTRATION_HISTORY).

## Next action

Commit when the user asks. Then regenerate the installed prompts (PLAN.md), add the profile location question, and observe 2–3 scheduled searches. No active operations.
