# Application desk — completed milestones

Only accomplished steps belong here. Upcoming work lives in PLAN.md; current verification and limitations live in HANDOFF.md.

## 2026-11-04 — standalone source repository

- Created an independent JobTracker repository from the existing tracker working source, without importing personal application records or Git history.
- Integrated Claude's pristine agent, guide and profile templates; retained the original supplied ZIP locally outside Git.
- Changed the tracker default to installation-relative data/ and added exclusive initialization that preserves an existing inventory.
- Verified 54 importer cases, view-model checks, API/save checks, repeat initialization and empty-inventory startup on Windows.
- Initial snapshot: 0f7ad2b. Connected origin to the separate GitHub JobTracker repository.

## 2026-11-05 — agent preparation

- Claude committed revised setup/routine instructions, coverage fallback, profile customization mapping and a tracker interface checklist (a030d28).
- Codex reviewed the integration and reproduced report-filename and setup-check gaps using temporary files. No real inventory was used.

## 2026-11-05 — portable tracker implementation (uncommitted)

- Renamed the visible product Application desk; retained repository and import command names.
- Added neutral settings, validated CLI and Settings screen; generalized groups/countries/timezone and bundled local SVG flags. Existing records are preserved when configuration changes.
- Fixed report-name guidance and validation side effects; documented runtime settings checks beyond the structural batch schema.
- Replaced private spreadsheet-runtime/template dependencies with bundled ExcelJS, a neutral empty-capable export and an employer-workbook helper with backup/concurrency/status protections. Removed the source-specific German-history migration command from this general-purpose package.
- Added installation self-check, bundled Windows/macOS Node runtimes, Start/Stop launchers, server reuse/free-port selection and a pristine-template release builder with checksums/licenses.
- Added CLAUDE.md handoff rules, PLAN.md and this history. Recorded fit-only colouring as an alternative to group-palette customization; no colouring policy change was applied.
- Verification: npm test passes (54 importer cases, view-model/API checks, 10 portable integration checks); npm audit reports zero known vulnerabilities with the UUID override. Browser test saved arbitrary tracks/countries/timezone successfully.
- Verified a fresh ZIP extracted into a Windows path containing spaces and ampersand: platform starter with no global Node on PATH, repeat startup, empty UI, self-check, Excel download, clean shutdown, neutral settings and private-file exclusion. Checked Mac executable permissions and all four official runtime hashes. Actual macOS/Windows ARM64 execution and scheduled-agent acceptance remain pending.
- The working package is dist/Application-desk.zip. No commit or push was made for this milestone.

## 2026-11-05 — Application tracker name and recipient guide

- Renamed the product, release folder and ZIP to Application tracker; repository/import command names remain unchanged. Historical milestone names above are retained as history.
- Rewrote READ ME.html and START_HERE.md around extract, Start, assistant-guided personalization and a test search; added a copyable setup instruction.
- Added archive audit for developer instructions/metadata, neutral inventory/settings and optional external private markers; workbook XML is inspected too. The old archive scan found no developer AGENTS.md or personal application reference. The reported file was located in the separate Applications chat workspace, not this repository or its Git history.
- Regression suite passed after the rename. Final archive acceptance/audit results are recorded in HANDOFF.md. No commit or push was made.

## 2026-11-05 — one recipient starting document

- Consolidated the duplicate HTML/Markdown starting guides into READ ME.html, including later-customization guidance. Removed START_HERE.md from the source/distribution; updated the builder/interface and checked all shipped first-party text for stale references. The rebuilt ZIP passed its archive audit.

## 2026-11-05 — GitHub repository rename

- Renamed GitHub repository to b-mishas/ApplicationTracker and updated origin; verified the new name through GitHub CLI.
- Updated current source-name documentation. Local directory rename remains pending because Windows reports the folder is in use. Uncommitted work preserved; no commit/push or test rerun.

## 2026-11-05 — local rename verification and stable environment interface

- Verified the local ApplicationTracker folder, matching GitHub repository and origin, with main still at a030d28.
- Retained JOBTRACKER_* environment-variable names at the user's request; repository naming does not require changing this interface.
- Passed npm test after restoration: 54 importer cases, view-model/API checks and 10 portable integration checks. Isolated renamed-folder Windows Start/repeat Start/export/Stop smoke test passed.
- Refreshed the stale distribution ZIP; archive audit and final clean-extraction Windows acceptance passed, including bundled runtime launch without global Node, self-check, Excel export and shutdown.
- Preserved Claude's agent/guide/profile/template files. No staging, commit or push; user put committing on hold. Real macOS, Windows ARM64 and scheduled-agent acceptance remain pending.
