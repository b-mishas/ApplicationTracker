# Application tracker checkpoint

Updated: 2026-11-05 00:17 UTC. Last agent: Codex. Scope: C:\Users\misha\Claude\ApplicationTracker. Branch main; implementation HEAD 45f07a3, followed by this documentation checkpoint. GitHub/origin: b-mishas/ApplicationTracker. Implementation commit pushed and remote main verified at 45f07a3 with ls-remote; this checkpoint will also be committed/pushed under the same user authorization. PR/CI not checked.

## Current state

Portable tracker plus search-agent package for a nontechnical recipient. Settings, importer safeguards, Excel export/workbook helpers, self-check, bundled Windows/macOS runtimes and Start/Stop launchers are committed in 45f07a3. READ ME.html is the single recipient starting guide; START_HERE.md is removed. See PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md for durable scope and interfaces.

Local folder rename is verified. At the user's request, retain JOBTRACKER_* environment-variable names independently of the ApplicationTracker repository name. Restored that prefix consistently in code, tests and documentation; no APPLICATIONTRACKER_* references remain in first-party source. Defaults remain installation-relative. Original personal tracker/data were not accessed.

## Verification

From the renamed checkout, npm test passed: 54/54 importer cases, view-model/API checks and 10 portable integration checks, including after restoring JOBTRACKER_*. Isolated Windows starter smoke test passed health, empty inventory, repeat launch, Excel export and shutdown. git diff --check passed. Existing ZIP was stale against nine source/package files, so rebuilt it. Build audit passed: 5,453 text/XML/SVG files, one workbook, no developer instruction files. Final rebuilt ZIP passed clean Windows extraction, starter without global Node, repeat launch, empty inventory/UI, self-check, Excel download, shutdown, neutral settings and macOS executable-permission checks. No fresh dependency audit or private-marker-file audit was performed this turn.

## Ownership and next action

Keep agent/, guides/, profile/ and templates/ unstaged for Claude. Codex scope is app/, scripts/, package files, launchers and tracker/release documentation. Shared interface/integration edits need deliberate review when splitting commits; folder ownership alone does not establish authorship. Builder requires templates/, so coordinate both commits before treating a clean checkout as release-ready.

Checks are complete; code was unchanged during the commit/push turn, so no test rerun was needed. No test server or build remains running. User authorized Codex commit/push; Claude will commit his files separately. Next: complete Claude commit, then verify a clean checkout has the required templates before release. Real macOS, Windows ARM64, personalized scheduled-agent/connector acceptance and recipient usability remain pending. Colour alternatives remain plans. This chat's sandbox still names the old folder; access to the renamed checkout required escalation. No release published.
