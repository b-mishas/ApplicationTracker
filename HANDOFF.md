# Application tracker checkpoint

Updated 2026-11-14 by Claude (sections below are Codex's 02:21 UTC snapshot). Checkout C:/Users/misha/Claude/ApplicationTracker, main at d6d880e, one commit ahead of the local origin/main ref (7256534; not fetched). Remote/CI unverified. No operations active.

## Claude, latest

d6d880e commits the routine model split (agent/ROUTINE_PROMPT.md, agent/SETUP_PROMPT.md, guides/SETUP_CLAUDE.md and their templates/ copies; templates identical). It has never been run: the user has no plan allowance left for a Claude rehearsal and will test with Codex from the ZIP. Not pushed. Release ZIP not rebuilt; the build reads the working tree, so the user must first decide whether Codex's uncommitted app/style.css and HISTORY.md go in. The manual scheduled task `rehearsal-daily-job-search` still holds the old Part B. Next: Codex commits or drops its local work, then build with scripts/build-release.mjs and run scripts/test-release.mjs.

## Latest committed fix

Confirmed the bug from ClaudeCodeLocal 8d636ce in ApplicationTracker: Reset preserved an ascending Actions sort; leaving In progress restored a remembered Company sort. Ported the exact Reset handler as 7256534 (Restore Actions descending sort when resetting filters). It clears filters/search, restores normal columns through syncViewLayout(), then sets Actions descending before rendering. This ordering prevents the remembered normal-view sort from overwriting the default. Existing five-status exclusions and dirty-draft protection remain. Only app/app.js and its HISTORY.md milestone were committed.

## Verification

Before-fix synthetic Chrome reproduced both failures. After-fix checks passed for reversed Actions, ascending In progress dates, normal/custom column restoration, cleared search/column filters, Urgent then Shortlisted priority, reload persistence and keeping drafts/sort unchanged when discard is refused. Syntax and staged whitespace checks passed. Firefox/physical-device acceptance untested. No real data or source checkout modified. No push or ZIP rebuild requested/performed.

## Earlier committed work

7355260 preserves exact manual applicationStatusText, including intentional blanks, throughout editor/storage and Excel/PDF exports; notes preserve it, while stage/date changes regenerate defaults unless explicitly overridden. API/export and browser checks passed. 53f988d adds calendar crosses, Application steps heading and initial Offer width/spacing. A separate 4a0ce12 commit for 30 px Reset/Columns heights appeared during this task. All four local commits remain unpushed.

## Local work preserved and next action

app/style.css and separate HISTORY.md entries retain uncommitted aligned compact picker columns (150 px minimum, labels above controls), previously checked at 390/1280/1800 px. Claude's agent/, guides/ and matching templates/ edits remain local and unrun, covering model selection, file-result handoff and throttling after the ignored mock rehearsal (17 records; manual scheduled task still exists). HANDOFF.md remains local. Review 7256534; preserve local work separately and use PLAN.md for remaining acceptance/release tasks. Prepare dist only on explicit request.
