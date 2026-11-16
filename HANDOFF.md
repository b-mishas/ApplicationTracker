# Application tracker checkpoint

Updated 2026-11-16 17:55 UTC by Claude. Checkout C:/Users/misha/Claude/ApplicationTracker, main at the [Wrapper] commit that follows bfe28a2, three commits ahead of the local origin/main ref (5e43c8b; not fetched). Remote/CI unverified. No operations active. Nothing pushed.

## Committed this session

bfe28a2: routine Part B gains a link-finder subagent, a `recheck` list in coverage.json (stop after three attempts), Hard rules and Completion sections at the top, and link-finder/re-check counts in the Coverage line. INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md name `recheck`. PLAN.md (draggable/resizable columns) went into the same commit at the user's request. agent/ equals templates/agent/. The routine has not been run in this form, nor with the model split from d6d880e.

## Committed code changes by Claude ([Wrapper] commit after bfe28a2)

- app/startup.mjs: Windows login shortcut omits default data/settings overrides and refuses arguments over 1023 characters (Windows truncates silently there; measured).
- app/port-settings.mjs: damaged server-port.json falls back to the default port.
- app/launch.mjs: a failed `--background` start appends its error to data/logs/login.log.
- Start/Restart/Stop (Mac).command: messages name the needed package; Stop says "Stop failed".
- scripts/build-release.mjs, scripts/test-release.mjs: mac-apple-silicon built and tested by default.
- app/test-startup.mjs: assertions for the refused long path and the damaged port file.
- README.md, app/README.md, app/SEARCH_WORKFLOW.md, PORTABILITY.md: three packages named. HISTORY.md: two entries.

## Verification

npm test: exit 0. npm run build: three ZIPs (Windows x64 47 MB, Mac Intel 53 MB, Mac Apple silicon 51 MB), audits ok. node scripts/test-release.mjs: exit 0; all three archives checked statically, Windows x64 package extracted and run. dist/ now holds test builds made before the commit from the same tree, not an approved release.

## Not tested, known gaps

- No Mac package has run on a Mac. macOS start at login is expected to hit the privacy protection for Documents/Desktop/Downloads; unverified and unfixed.
- Moving the folder after enabling start at login leaves the old shortcut or LaunchAgent behind; unfixed.
- Windows ARM64: no package, starter says so.
- START_HERE.html does not say which ZIP to choose; that happens before download.

## Other local state

design/ (untracked wrapper sketches, user review pending) and the Codex worktree at C:/Users/misha/.codex/worktrees/new-count-boxes/ApplicationTracker are unchanged; see HISTORY.md for the counter merge. The manual scheduled task `rehearsal-daily-job-search` still holds an old Part B.

## Next

A Codex rehearsal of the routine from a fresh ZIP. Remaining release items are in PLAN.md.
