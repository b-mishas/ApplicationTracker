# Agent handoff

Updated 2026-11-23, Claude. Scope: search-agent prompts and capture check after roadmap milestone 13. main at 95b447e, 3 commits ahead of origin/main (not pushed); remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Committed since the last push

- a311937: five capture-check fixes from Codex's review of JobTracker's port:
  - the CLI exits 2 without jobs.json or the profile;
  - the finish check covers all runs;
  - `reassess` beats a dropped-list match;
  - `--seen` reports `repeat`;
  - a find that gains an ID or URL stays one vacancy.
- 95b447e: posting extracts report `text` full, partial or none. The lead rereads partial or unclear extracts and accepts a full text without requirements. Also PLAN.md items for the two prose-only limits.

## Changed (uncommitted)

- `app/test-templates.mjs` (agent-owned: it checks agent files) and the `package.json` test script (HANDOFF_WRAPPER notes it): a drift test between agent/, guides/, profile/ and templates/.
- Profile template §4 (both copies): a line saying whether relocation and on-site limits are hard limits or preferences.
- Setup step 3 asks which, and never assumes.
- Routine §3: roles breaking hard limits are dropped and counted; otherwise the constraint goes in gaps.
- PLAN.md: both items removed as done. HISTORY entry added.

## Verification

- Full `npm test` exit 0 with the drift test.
- The drift test's self-check catches an edited copy and a one-sided file.
- `git diff --check`.
- One earlier `npm test` run failed intermittently (output not kept); later runs passed.
- No agent run on any of this.

## Known limits

- Finish and reassess rules are prose-enforced; LinkedIn and employer URLs of the same job are only `similar` (both in PLAN.md).
- The location drop rule still needs posting text when the alert doesn't show the location.

## Elsewhere

JobTracker's port lives in `C:/Users/misha/Claude/Code/JobTracker` (SEARCH_PORTING.md, scripts/capture-check.mjs), uncommitted there.

## Next action

Commit when the user asks. Then regenerate the installed prompts (PLAN.md, due) and observe 2–3 scheduled searches. No active operations.
