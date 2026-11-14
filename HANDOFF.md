# Application tracker checkpoint

Updated 2026-11-14 17:29 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker, branch feature/per-platform-release, HEAD is the startup commit containing this snapshot (parent 8e02373), tracking origin/feature/per-platform-release. Remote/CI unverified this turn. No active operations. Startup changes, guide wording and target aliases are included in this commit; no push, branch switch or ZIP rebuild performed.

## Current work

Settings now offers the off-by-default checkbox **Start server at login**, independent of the search agent and portable export preferences. Save creates/removes this installation's per-user Windows Startup shortcut or macOS LaunchAgent; Cancel leaves it unchanged. Login launches suppress browser opening. Disable before moving/deleting the installation; enable again after moving.

Start reuses the running server on both platforms; separate Restart files restart explicitly. launch.mjs saves a fixed port in data/server-port.json (default 8765), adopts an older running server's address, serializes concurrent starts and waits for shutdown before restarting. --port or JOBTRACKER_PORT selects another fixed port; occupied ports fail without random fallback. macOS keeps the launcher attached for supervision without requesting respawn after Stop.

Changed startup/server/Settings files, Windows Start, new Restart files, package tests, release builder/checks and documentation. START_HERE now formats file references as code followed by normal-text “file”, uses the new checkbox name, and says “Settings → Name: name in exported report titles.” README/SEARCH_WORKFLOW wording matches. Target aliases win-x64, win-arm64, mac-x64 and mac-arm64 remain supported alongside original names; ZIP names unchanged. Existing dist archives remain stale. Compact expanded-field layout remains outside this branch.

## Verification and next action

Startup regressions passed using disposable data: port conflicts/persistence, legacy adoption, concurrent Start, actual Windows starters/bundled runtime, Restart/Stop, origin/validation, temporary Windows shortcut creation/removal and its actual silent command, escaped paths, macOS plist generation and foreground shutdown. No real login settings or positions changed. Chrome checked Settings save/Cancel/reopen, desktop/390 px layouts and guide rendering. API checks and 15 portable checks passed. Target parsing/syntax checks passed. Latest text edits passed exact-wording checks. Final syntax and whitespace checks passed before committing; functional tests were not repeated for unchanged code.

Actual Windows login, macOS execution/login and OS approvals still need acceptance testing. No extraction test rerun without a new ZIP. Next: use Restart once to load the new endpoint, then test login behaviour. Build ZIPs only on explicit request.
