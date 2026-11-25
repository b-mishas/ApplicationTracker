# Agent handoff

Updated 2026-11-25, Claude. Scope: Codex's review of ac8fa4b..2bb2f48 and its follow-up review, plus the routine gaps against JobTracker. Committed on main as one [Agent] commit after 2bb2f48 (see git log); origin/main at 8663380, not pushed. `APPLICATIONTRACKER_FIXES.md` and `design/` untracked and unrelated. Remote/CI unverified.

## Posting-date port — 2026-11-25T12:03:39Z (Codex)

Port of JobTracker `1078034`/`3e38f5a` on main, starting at ee59cd6; remote/CI unverified. User authorized two commits: this commit records the routine/template instructions; the wrapper implementation follows separately. `agent/ROUTINE_PROMPT.md` and its pristine template now require valid YYYY-MM-DD or empty, resolve relative ages against observedAt in Part A's timezone, and retain original wording/time in evidence. Hours use elapsed-time subtraction. Ranges, month-only and ambiguous dates remain empty. Import schema enforces this contract; see INTERFACE_FOR_TRACKER.md, app/SEARCH_WORKFLOW.md and HANDOFF_WRAPPER.md. Template-drift and importer checks passed. No real search or real database migration was run. Previously generated installation prompts must be regenerated before using the stricter importer. Existing next actions below remain applicable; no active agent operation was started. Preserve unrelated PLAN.md, ROADMAP.md, APPLICATIONTRACKER_FIXES.md and design/ changes. Two local commits requested; no push or ZIP build requested.

## Done

- `app/diagnostics.mjs`: whole paths masked (spaces, quotes, UNC, `/tmp`, `/sessions`, `~/`); tests in `test-diagnostics.mjs`. START_HERE problem-report line trimmed to one sentence (user; never edit START_HERE without explicit approval).
- `app/finish-run.mjs`: retry items from `open(root)` over all runs, labelled `import` (saved assessment, no rerating), `repair` (no/unknown state, unreadable ledger) or `decide`. Tests cover all three.
- Routine and template: Part A `FIRST_SEARCH_DAYS` with a 30-day fallback in Part B too; `gmailInterval` saved before listing, earliest `from` of an unfinished run kept; run-log.json at start; per-mail completion after job lines are saved, with `announced` and `mails-reread.jsonl` for short mails; 60 mails per subagent; no copied mail text; listings to a file; employer alert mails never employer checks; `postedDate`; duplicate hints; coverage.json via temp file; Search coverage line; exact Codex model names `gpt-6-luna` / `gpt-6.1-terra` beside `haiku` / `sonnet`.
- Setup and template ask the first-search days. Closure rule unchanged (user, PLAN 9).

## Verification

`npm test` exit 0; template drift test; `git diff --check` clean. No agent run: interval carry-over, mail skip and import dispatch are prompt rules, checked by rereading only. Codex model names taken from JobTracker's codex-platform notes and the Terra rehearsal report; not confirmed in a Codex run.

## Next action

- Rehearsal run 2: regenerate the installation's `agent/ROUTINE_PROMPT.md` and filled prompt from the current routine, set a spend cap, then the user replaces the Cowork task's prompt (routine `trig_01Ctas6LcvghQUjzvgvg4C6J`, paused) and runs it once attended. Cost via run-usage.cjs needs a signed-in claude.ai tab.
- Rebuild Mac and Windows packages before a release.

No active operations.
