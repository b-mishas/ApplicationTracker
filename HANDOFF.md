# Application tracker checkpoint

Updated 2026-11-16 19:10 UTC by Claude. Checkout C:/Users/misha/Claude/ApplicationTracker, main four commits ahead of the local origin/main ref (5e43c8b; not fetched): bc6de61, bfe28a2, 7a4728f and the latest [Wrapper] commit holding this file. Remote/CI unverified. No operations active. Nothing pushed.

## Committed this session (Claude, at the user's request, including app code)

- bfe28a2 [Prompt]: routine Part B gains a link-finder subagent, a `recheck` list in coverage.json (stop after three attempts), Hard rules and Completion sections at the top, and link-finder/re-check counts in the Coverage line. agent/ equals templates/agent/.
- 7a4728f [Wrapper]: Windows login shortcut refuses arguments over 1023 characters (Windows truncates silently; measured) and omits default overrides; default build and release test add mac-apple-silicon; damaged server-port.json falls back to the default; failed `--background` start logs to data/logs/login.log.
- Latest [Wrapper]: start at login is offered on Windows only (API reports unsupported on macOS and refuses changes; registration code kept). Login entries are recorded in `%APPDATA%/ApplicationTracker/login-entries.json`; app/launch.mjs removes entries whose launcher no longer exists at every start. CLAUDE.md and AGENTS.md gain the commit-prefix rule: `[Prompt]` or `[Wrapper]`, then Sentence case.

Details are in HISTORY.md (three entries dated 2026-11-16).

## Verification

npm test: exit 0 after the last change. npm run build and node scripts/test-release.mjs passed before the last change (three ZIPs; Windows x64 package extracted and run); not repeated since, so dist/ lacks the last commit. dist/ holds test builds, not an approved release.

## Not tested, known gaps

- No Mac package has run on a Mac. START_HERE.html does not yet explain the first-launch approval for unsigned files.
- The routine has not been run with the model split (d6d880e) or the link finder and re-checks (bfe28a2).
- Login entries created before the registry existed are not cleaned. An unplugged external drive counts as a missing folder.
- Windows ARM64: no package; the starter says so.
- START_HERE.html does not say which ZIP to choose; that happens before download.

## Other local state

design/ (untracked wrapper sketches, user review pending) and the Codex worktree at C:/Users/misha/.codex/worktrees/new-count-boxes/ApplicationTracker are unchanged. The manual scheduled task `rehearsal-daily-job-search` still holds an old Part B.

## Next

Rebuild dist on request, then a Codex rehearsal of the routine from a fresh ZIP (automation on Terra). A Mac owner should try a Mac package once. Remaining release items are in PLAN.md.
