# Wrapper handoff

Updated 2026-11-28T08:46:00Z — Claude.

## Scope and checkout

User-approved plain-language rewrite of START_HERE.html and renaming of the starter files. Main at 861116f, equal to the locally recorded origin/main (not fetched); remote/CI unverified. Nothing committed or pushed for this work; the user asked for implementation only.

The same checkout holds uncommitted agent-side changes not made in this session (agent/, templates/agent/, app/finish-run.mjs, setup-*.mjs, app/SETUP_WORKFLOW.md, app/SEARCH_WORKFLOW.md, INTERFACE_FOR_TRACKER.md, app/test-recovery-outcomes.mjs); see HANDOFF_AGENT.md. Untracked design/ left alone. Commit only the files below.

## Changed (uncommitted)

- Renamed (git mv): `Start/Restart/Stop (Windows).cmd` → `Application Tracker.cmd`, `Restart tracker.cmd`, `Stop tracker.cmd`; the Mac `.command` files likewise.
- scripts/build-release.mjs, scripts/test-release.mjs, app/test-startup.mjs: new names. app/README.md: "Open the Application Tracker file".
- START_HERE.html: steps cut to essentials (details in HISTORY.md, 2026-11-28 entry). Windows/Mac switch kept for the Mac approval block and the "If something goes wrong" line.
- HISTORY.md entry.

## Verification

npm test: exit 0 (test-startup runs the renamed Windows starters). Built-in browser: Windows view shows only the Windows line, Mac view only the Mac block and line.

## Not tested / known gaps

- scripts/test-release.mjs and npm run build not run; dist/ predates the rename.
- No Mac package has run on a Mac; the Open Anyway steps are unconfirmed. Windows behaviour for a browser-downloaded `.cmd` is untested.
- In-app texts still say "Start server at login" and "Open the Restart file for your system" (app/app.js:931); the server window says "Ctrl+C stops the server". Suggested for plain wording, not changed.
- Earlier Codex port: Firefox, touch and physical-device checks remain open (see HISTORY.md).

## Next

User review and commit (`[Wrapper]`), then rebuild and run scripts/test-release.mjs. No active operations.
