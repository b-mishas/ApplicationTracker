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

## 2026-11-05 — Codex tracker commit and push

- Committed tracker/settings/importer/Excel/launchers/packaging and related documentation as 45f07a3; pushed main to b-mishas/ApplicationTracker and verified the remote hash.
- Kept agent/, guides/, profile/ and templates/ out of the commit for Claude. Pristine templates remain required by the builder; a clean-checkout release awaits Claude's separate commit.
- No code changed during this commit/push step; retained the preceding passing regression and rebuilt-ZIP acceptance evidence. Updated the handoff and plan for the next agent.

## 2026-11-05 — Settings wording and header control sizing

- Updated the group and geography Settings labels to the user's requested wording; country-code examples are DE, CH, UK.
- Applied shared header export-control styling to Settings; headless Chrome measured Settings, Export applications and JSON at 30 px high at both 1280 and 800 px viewport widths. Exact label text and screenshot checked.
- Refreshed distribution ZIP and checksum, verified all archived app files match source, and passed the archive audit. Changes are text/CSS only; no full regression or extraction rerun. Claude-owned files untouched. No commit/push for this milestone.

## 2026-11-05 — Fit-only colours, country picker and development instructions

- Implemented the user's chosen Fit-only colouring, neutral wrapping Group labels and removal of the Colour selector; preserved group filtering and kept provisional markers beside Fit.
- Added a searchable country-name/code checklist synchronized with the manual code field. Verified selection persistence through filtering, Cancel/Save/reopen, keyboard focus, validation and preservation of existing jobs and UK/GB spellings.
- Added five fictional positions (Fit 1–5) to ignored local data/jobs.json using the transactional writer and a backup; PLAN.md requires cleanup before shipping. No real inventory or customized settings were changed.
- Created AGENTS.md with Codex scope, collaboration, verification and explicit-only distribution-build instructions. Claude-owned files unchanged; no distribution build, staging, commit or push.
- npm test passed on rerun (54 importer cases, view-model/API and 10 portable checks). First run had an EPERM lock-file error in an unchanged concurrency test. Headless Chrome interactions and 800/390 px dialog sizing passed; screenshots inspected, no browser JS errors. Local ZIP/checksum remain unchanged and deliberately behind current source.

## 2026-11-05 — record-driven tracker, automatic dates and default group palette

- Removed group/country configuration, the country picker and tracker timezone. Settings now contains only Excel language (for export), with no explanatory paragraph. Legacy preferences remain readable and are cleaned on explicit save with a backup.
- Importer accepts profile-assigned groups and recognized countries without settings or a whitelist. Invalid codes still fail validation; bundled flags cover all supported countries, UK uses GB's flag, and legacy unknown codes display as text.
- Dates use execution-local time; agent instructions align remote import process TZ with Part A. Updated necessary agent/profile passages and matching templates without changing Claude's committed fit calibration/safety rules.
- Restored default Group colouring alongside Fit, using the original four pastel hues then Oklab maximin selection. Automatic inventory metadata stabilizes colours across sorting/filtering/reordering/removal/addition/reload. First-eight text contrast minimum 5.51:1; no new dependency or colour setting.
- Final npm test passed: 54 importer cases, view-model/API, palette stability/contrast and 12 portable checks. Headless Chrome passed settings, filters/flags, local dates across LA/Auckland, language export, legacy data handling, palette persistence and 800/390 px layout. Screenshots inspected; templates match; whitespace check passed.
- Added the requested short button-focused tutorial with a translucent overlay to PLAN.md as future work. Five local development mocks preserved. No ZIP/checksum rebuild, staging, commit or push.

## 2026-11-05 — recipient guide copyable prompt boxes

- Replaced the guide's textarea and inline chatbot instructions with four selectable, noneditable code-style boxes: setup, test search, search customization and startup troubleshooting.
- Each Copy button copies only the prompt text, shows feedback and selects the exact text for keyboard copying if clipboard access is denied/unavailable. Setup/customization prompt wording preserved; guide wording aligned with export-only Settings.
- Local-file Chrome checks passed: all four payloads (clipboard intercepted, system clipboard untouched), feedback/reset, native keyboard activation, both fallback cases and 1280/390 px layout. Screenshot inspected; no browser JS errors. No full application regression rerun for this guide-only change. ZIP/checksum unchanged; no staging, commit or push.

## 2026-11-05 — application-stage row emphasis

- Applied uses bold gold-brown text and Interview bold dark emerald; normal row striping is preserved. Fit/Group badge colours remain meaningful.
- Offer uses a green row/detail background, gold left accent and a gold dollar badge beside its status. Rejected text, links and badges are grey without disabling editing.
- Chrome verified styling across sorting, hover, expansion and live status changes, preserving notes/application dates; default rejected filtering and 390 px layout remain intact. Screenshot inspected; no JS errors. Focused view-model/API-save checks and whitespace checks passed.
- Changes are confined to tracker rendering/styles and project records. Actual local mock data and ZIP/checksum were untouched. No staging, commit or push.

## 2026-11-06 — application milestones and saved filters

- Status and interview outcome now save automatically in the expanded row. The editor keeps unsaved drafts and handles revision conflicts. Save changes and Cancel are inactive when clean. New and Shortlisted hide the application date.
- Added separate interview date, outcome, outcome date and offer date fields to the saved inventory. Interview outcomes participate in the normal status filters. Excel includes dated interview and outcome history in Status. Discovery imports protect user-owned milestones.
- Added New, Shortlisted, Active and All presets. Search, column filters, presets and Found since persist in the tracker data folder across reloads and restarts. Reset saves the default view.
- npm test passed 57 importer cases, view model, palette, milestone API/Excel checks and 12 portable integration checks. Headless Chrome verified the editing flow, revision conflicts, filter restoration on a new port, Reset and 390 px layout.

## 2026-11-06 — Windows restart and stage editor layout

- Start Windows.cmd detects the running server by installation identity, stops it and starts a fresh instance. The Windows source launcher passed an isolated restart check with two installations and saved filters.
- Reordered expanded stage fields and moved the generated milestone sequence into Application status text. Typed detail remains separate from the dates and outcome in JSON. Headless Chrome verified all eight stage layouts, date order and text persistence. The full npm test suite passed.

## 2026-11-06 — interview outcome and Status synchronization

- Selecting Rejected, Offer or Withdrawn as interview outcome now updates the primary status in the same save. Pending returns it to Interview. Older Interview records with an outcome show that outcome in the Status selector and retain their dates.
- The full npm test suite and Chrome editor checks passed. On Windows with dd.MM.yyyy as its regional pattern, the browser's native date input rendered 06.11.2026. The inventory still stores dates as YYYY-MM-DD.

## 2026-11-06 — stable filter calendar during status saves

- Status autosave keeps the native Found since calendar enabled while the existing save guard blocks filter changes. Headless Firefox reproduced the 18 px shift before the fix and confirmed stable toolbar positions before, during and after a delayed save. Chrome editor checks passed.
- Firefox also verified that changing Status updates the interview outcome for an interviewed position, and changing Status back to Interview resets the outcome to Pending.

## 2026-11-06 — hide Offer date for Rejected

- Rejected positions hide Offer date while preserving any previously saved value. Headless Chrome verified the field stays hidden after switching to Rejected and reopening the editor, and the saved date remains in the inventory.

## 2026-11-06 — disabled editor buttons

- Save changes and Cancel keep their resting appearance on hover while disabled. Chrome verified hover feedback with both buttons enabled and disabled.

## 2026-11-06 — shared Interview and Offer marker

- Interview and Offer use the same green left-edge marker on the main row and expanded details. Chrome verified both markers and the Offer dollar badge.

## 2026-11-06 — aligned Interview marker

- Interview now uses the same 3 px width above and below the divider. Restored Offer's original gold marker and widths. Chrome verified alignment and the original Offer styling.

## 2026-11-06 — consistent row marker widths

- All left-edge markers use the same 3 px width. Chrome verified Interview, Offer and standard expanded details.

## 2026-11-06 — Urgent overview count

- Replaced the Fit 4–5 overview with Urgent immediately after Shortlisted. Chrome verified the order, live updates when flags change and a stable count across filters.

## 2026-11-06 — landscape PDF export

- Added Export applications as PDF, using the browser's print dialog and the same saved rows, language and status history as Excel.
- Added print-route integration coverage. Headless Chrome rendered a six-page A4 landscape report with all 67 synthetic application rows and repeating column headings.

## 2026-11-06 — grouped export controls

- Grouped Excel and PDF in a single Export applications as box. Headless Chrome verified both controls and the layout at desktop and narrow widths.

## 2026-11-06 — personalized export titles

- Moved Settings to the far right and added the JSON export tooltip. The optional Name setting adds a hyphen and name to the Excel and PDF headings. The Excel heading spans the table columns.
- Verified saving and clearing the name, workbook filters and freeze panes, PDF landscape rendering, and toolbar layout at desktop and narrow widths.
