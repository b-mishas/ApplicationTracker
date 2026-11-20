# Agent handoff

Updated 2026-11-20T19:15Z, Claude. Scope: orchestration roadmap milestone 6 (small-model acceptance rehearsal). main at 18a85df [Agent] Check finds against inventory before rating, 7 commits ahead of origin/main, not pushed; remote/CI unverified. `design/` is unrelated untracked work. No code, prompt, template, packaging or installed-automation change.

## Done (uncommitted documentation only)

- Rehearsal in `rehearsal/runs/2026-11-21-small-model-acceptance/` (Git-ignored): PROTOCOL.md (written before any run, two amendments), arm A (helpers, 18a85df) and arm B (no helpers, b66c262) installations, answer keys, streams, scoring scripts, `evaluation/comparison.json` and `evaluation/REPORT.md`.
- Updated: roadmap milestone 6 marked with its result and next action, ORCHESTRATION_HISTORY.md entry, root HISTORY.md entry, runs README row.

## Result

Lead `claude -p --safe-mode --model claude-sonnet-5-5`; subagent aliases pinned to claude-haiku-5-5 / claude-sonnet-5-5 (CLI 2.1.233's bare aliases resolve to Sonnet 5 / Haiku 4.5). Every logged message was verified on the 5.5 models.

Three Greenhouse boards (42 listings) were seeded with Applied, Dismissed and dropped traps.

- **Outcomes:** both arms kept 8/8 relevant postings, made 0 trap reads and reported exact counts.
- **Tokens:** A used 1.09M input in 115 s; B used 0.69M in 139 s, so A cost 57% more (its lead 91% more).
- **Decision rule:** cut further.

Limits:
- One run per arm.
- No interruption or multi-run state.
- A read the postings itself while B delegated them to Haiku.
- The traps were exact-ID matches, which B also caught.

## Known issues

- Both leads wrote the run ID to `/tmp`, outside ROOT; A's PowerShell import step then hard-coded the ID.
- Launching `claude` from inside the desktop app needs the desktop app's CLAUDE*/ANTHROPIC* environment variables stripped (see `evaluation/run-arm.mjs`).
- The personal tracker, profile and workbook were verified unchanged by hash.

## Next action

The user decides how far to cut the helpers. Candidates:
- Keep only the `next` known check, used when subagents return finds.
- Drop the task manifest and capture for small runs.

Any recovery claim needs a multi-run or interrupted rehearsal. Committing these documentation changes (`[Agent]`) is also the user's call. No active operations.
