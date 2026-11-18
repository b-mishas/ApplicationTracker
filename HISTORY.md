# Application tracker — history

[PLAN.md](PLAN.md) lists remaining work. [HANDOFF_AGENT.md](HANDOFF_AGENT.md) and [HANDOFF_WRAPPER.md](HANDOFF_WRAPPER.md) record the latest verification details. Entries are newest first; add new ones directly below the separator line.

--------------------

## 2026-11-18 — active-only Offer badge and tracker restart (Codex)

- Gold fill/outline now applies only to active Offer; inactive Offer matches the other outcome buttons. Added an active-only decorative dollar circle using the existing badge class, with equal button widths retained.
- Investigated Rejected not defaulting today: normal server process predated the backend date changes. Restarted this installation at its existing port 56068 using the standard background launcher; before/after inventory/settings hashes matched. No real records changed.
- Synthetic Chromium verified Rejected defaults to 2026-11-18 even with a blank interview date; active Offer gold/dollar, inactive neutral/no dollar, and no button overflow. Syntax/whitespace checks passed. Test server stopped; normal server remains running current backend. No commit/push/ZIP build; other browsers/platforms untested.


## 2026-11-18 — gold Offer outcome button (Codex)

- Matched the Offer shortcut to the status badge: pale-gold fill, dark-yellow outline and dark-gold text, including when selected. Equal sizing and neutral Rejected/Withdrawn selection remain.
- Synthetic desktop Chromium rendering and computed-color comparison confirmed identical button/badge colors. Whitespace check passed. Temporary test server stopped; no real data/settings changes, commit, push or ZIP build. Other browsers/platforms untested for this CSS-only change.


## 2026-11-18 — status date defaults and equal outcome buttons (Codex)

- Made interview outcome buttons equal-width in a three-column grid matching the interview date column, with 3 px side padding and neutral grey selection. Used 11 px single-line labels so Withdrawn fits without wrapping; browser measurements confirmed equal widths and no overflow.
- Applied now defaults its application date to today on a real status change, including when an older application date exists. Offer, Rejected and Withdrawn also default their dates to today. Interview leaves an unknown date empty. Explicit dates override defaults; same-status saves preserve edited/cleared dates. Centralized application-date assignment in the shared transition helper.
- Interview dates survive transitions to Offer/Rejected/Withdrawn/Dismissed and clear on New/Shortlisted/Applied. Offer dates survive Rejected/Withdrawn/Dismissed and clear on New/Shortlisted/Applied/Interview. Retained dates remain visible in Dismissed records.
- Full model transition matrix, date-default/override/clear regressions, isolated API/export/Undo checks and syntax/whitespace checks passed. Synthetic in-app Chromium checks verified today's Applied/Rejection dates, blank Interview default, retained dates on rejection and desktop equal-width/neutral-shading rendering. Temporary test server stopped. Real records/settings unchanged; normal tracker not restarted. Narrow screens, other browsers and physical platforms untested this turn. No commit/push/ZIP rebuild.


## 2026-11-18 — unified status actions and milestone totals (Codex)

- Replaced the interview outcome selector with Rejected, Offer and Withdrawn buttons beside the interview date. Buttons use the main status autosave/draft/Undo flow. New ordinary saves normalize legacy interviewOutcome into status and remove the redundant field; older records and deprecated API inputs remain readable. Rejection/withdrawal dates use the existing date field with clearer labels.
- Applications sent now uses a valid application date OR current Applied/Interview/Offer. Interview invites uses a valid interview date OR current Interview. Offers received uses a valid offer date OR current Offer, retaining dated withdrawn offers. Empty dates suppress legacy date fallback without excluding qualifying current stages. Backward corrections still clear later milestones.
- Model regressions, isolated API/export/Undo checks, JavaScript syntax and whitespace checks passed. In-app Chromium with synthetic inventory verified dateless Interview/Offer counts, dated withdrawn offers, outcome buttons, note drafts, saving, Undo, reload, Offers filter membership and desktop rendering. Local networking for the API checks required sandbox escalation; the elevated run passed. No real records/settings changed; temporary test server stopped. Other browsers, narrow screens and physical devices were not tested this turn. No commit, push or distribution rebuild.


## 2026-11-18 — sidebar navigation and application shortcuts (Codex)

- Pipeline and Statistics replace the overview and toolbar presets. Applied retains the former In progress membership and dated layout. Interview invites requires a valid interview date. Offers follows current effective Offer status, including undated offers, and appears only above zero.
- Added Applied-stage Rejected and Interview shortcuts using autosave, draft preservation and Undo. Standardized Application steps spacing, simplified Status checklist labels and renamed the export-language setting. On narrow screens, Pipeline and Statistics sit above the results.
- Clearing a milestone date writes an empty string that overrides legacy history. Moving back to New, Shortlisted or Applied clears later milestones. Five local mock scenarios cover legacy, cleared and later-stage histories. The ten mock records remain in ignored runtime data.
- Focused model and isolated API tests passed, including milestone correction, reload, exports and Undo. Earlier Chromium checks covered all eight sidebar views, shortcuts, desktop and 390 px rendering. The final Offers check displayed exactly one current offer in the ten-mock inventory.

## 2026-11-18 — separate agent and wrapper handoffs (Codex)

- Replaced the shared checkpoint with HANDOFF_AGENT.md and HANDOFF_WRAPPER.md; preserved the latest routine-cost review and unfinished wrapper context. Both assistants now select handoffs by function, including API extraction scripts under agent work, and update both only when work spans both areas. PLAN/HISTORY remain shared; the one-editor rule remains.
- Updated documentation references and release builder/audit/test exclusions. Matching-rule and link checks, all three JavaScript syntax checks, and git diff --check passed. Synthetic in-memory archive checks accepted neutral content and rejected legacy and both new handoff names; builder/test guards also matched all three. No ZIP build, runtime/platform acceptance, commit or push; existing unfinished implementation was preserved.

## 2026-11-17 — START_HERE.html: Windows/Mac views, Mac first-start steps (Claude)

- A Windows | Mac switch in step 1 preselects the reader's system from the browser; system-specific lines carry `data-os` and the other system's lines are hidden. Without JavaScript both are shown.
- The Mac view has a "First start on a Mac" block: Done, then System Settings → Privacy & Security → Open Anyway, then Open (macOS 15+), with the Control-click route for macOS 14 and older, and the same approval for Stop and Restart. "If something is blocked" links to it. The Windows view drops the "(Windows only for now)" remarks; the Mac view says start at login is not available. The copy fallback names only the reader's shortcut. Copy messages appear in the prompt header left of the Copy button instead of a line below the prompt, so copying no longer changes the box height (measured 107 px before and after). After a successful copy the prompt text dims to 45% opacity at once, together with "Copied", for 0.5 s, then fades back over 0.2 s.
- Checked in the built-in browser (Chromium, Windows): Windows preselected, switch shows only the Mac lines. The macOS steps are written from macOS 15 behaviour and have not been checked on a Mac with this package.

## 2026-11-16 — start at login: Windows only, stale entries removed (Claude)

- Settings no longer offers "Start server at login" on macOS: the API reports it as unsupported there and refuses changes, because the LaunchAgent has never run on a Mac and is expected to be blocked for folders in Documents, Desktop or Downloads. The registration code and its data-only test remain. START_HERE.html and the Settings hint say "Windows only for now".
- Each login entry is recorded with its launcher path in a per-user file outside the Startup folder (`%APPDATA%/ApplicationTracker/login-entries.json`). Every start removes entries whose launcher no longer exists, so a moved or deleted folder leaves no broken login command. Only this app's own entry names in the login folder can be deleted.
- npm test passed with new assertions: a live entry stays, a moved folder's entry is removed, a tampered registry cannot delete another file, macOS is not offered. Entries created before this change are not in the registry and are not cleaned.

## 2026-11-16 — login-start limit, Apple silicon package, launcher fixes (Claude)

- Start at login on Windows: the shortcut command omits the data and settings overrides when they are the folders next to app/, and saving is refused with a plain message when the arguments would exceed 1023 characters. Windows cuts shortcut arguments there without an error (measured with WScript.Shell on Windows 11), which previously left an enabled-looking but broken login command for install paths over about 50 characters.
- The default build and scripts/test-release.mjs now cover Application-tracker-mac-apple-silicon.zip; Mac starters name the package the processor needs. A damaged data/server-port.json falls back to the default port. A failed `--background` start appends its error to data/logs/login.log. Stop (Mac).command reports "Stop failed".
- npm test passed (new assertions for the refused long path and the damaged port file). npm run build produced three ZIPs with passing audits; node scripts/test-release.mjs passed for all three and ran the Windows x64 package. No Mac package has run on a Mac.

## 2026-11-16 — routine: link finder, re-check counter, hard rules (Claude)

- Ported from the live JobTracker routine into Part B (bfe28a2): link-finder subagent, `recheck` list in coverage.json with a three-attempt stop, Hard rules and Completion sections at the top, link-finder and re-check counts in the Coverage line. INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md name `recheck`. Text change only; no run performed.

## 2026-11-14 — grouped overview counters

- Ported ClaudeCodeLocal 1299faf: application overview groups Positions collected, Applications sent, Interviews held and Applications in progress; a separate priorities group holds Shortlisted, Urgent and New. A shared parent delegates all seven click filters; groups wrap with a 12 px gap.
- Synthetic Chrome checks passed for group order, all click actions, unchanged four toolbar presets, neutral button styling and no page overflow at 390/900/1280/1800 px. Desktop/narrow rendering inspected; existing save/Undo/export API regressions passed.

## 2026-11-14 — total interviews counter

- Ported ClaudeCodeLocal 19a25bd: clickable Interviews held counter across recorded current/legacy interviews and later outcomes; Status choices distinguish Interview (pending)/(total). Renamed the sent-applications counter to Applications sent, matching the source feature.
- Model and synthetic Chrome checks passed for legacy/outcome membership, pending-only filtering, search, reload, All/Reset and live counters after status autosave and Undo.

## 2026-11-14 — Settings editing and positioning

- Confirmed the live server still lacked /api/port-settings (404), which left the control disabled. Added explicit Restart/reload guidance for older servers and restarted the actual tracker at its existing address; inventory and export settings were byte-for-byte unchanged, and the endpoint now allows editing.
- Anchored the Settings dialog near the viewport top, with bounded height and internal scrolling. Chrome reproduced the old vertical-centering jump, then verified a stable heading/top edge during expand/collapse, actual keyboard port entry, Cancel, stale-server feedback and short/narrow-screen usability. Existing port Save/Cancel/conflict browser checks still pass.

## 2026-11-14 — local port Settings

- Added Advanced Settings with a validated Local port, clickable current address and pending-Restart guidance. Saves are revision-protected and leave the server running; Cancel changes nothing. Export settings and position JSON remain unchanged.
- Restart checks the requested port before stopping the server and attempts to restore the old address on a later launch failure. Start/Restart files offer replacement-port input or cancellation when blocked; background login never prompts. The prompt releases the installation lock while waiting. Updated guide, interface and release file list without rebuilding archives.
- Isolated port/API/prompt and existing startup regressions passed, including actual Windows launchers and temporary login registration. Chrome verified validation, occupied-port rejection, Cancel/Save, pending values/current address and desktop/390 px layouts. Existing API regressions passed; actual macOS execution/login and recipient acceptance remain pending.

## 2026-11-14 — total applications counter

- Ported ClaudeCodeLocal edc13d6: clickable total sent-applications counter and Applied (pending)/(total) Status choices. Totals include later outcomes and legacy application/interview history, using existing JSON fields. Other filters, All/Reset and view persistence remain compatible.
- Model regressions and synthetic Chrome checks passed for outcomes, unsent exclusions, search, reload, neutral All and normal-column restoration after In progress.

## 2026-11-14 — bookmarkable local startup

- Start reuses the running tracker on both platforms; separate Restart files restart it explicitly. A fixed local port (default 8765) is saved per installation, including adoption of older running servers. Concurrent starts are serialized; conflicts fail without random fallback. A different port can be selected with --port or JOBTRACKER_PORT.
- Settings offers opt-in background startup at login through a per-user Windows shortcut or macOS LaunchAgent, independent of agent scheduling and export preferences. Cancel leaves registration unchanged. Updated START_HERE, interface/docs and release file lists/checks; no ZIP rebuilt.
- Isolated Windows checks passed for Start/Restart/Stop, port persistence/conflicts, legacy adoption, origin checks, real temporary shortcut creation/removal and its silent login command. Chrome verified Settings save/Cancel, registration state and desktop/390 px layouts; API and 15 portable regressions passed. Actual OS login and macOS execution remain acceptance checks.

## 2026-11-14 — matching Stop names and build targets

- Renamed the source Stop launchers to `Stop (Windows).cmd` and `Stop (Mac).command`, and updated release build/test references. The four-target `--target` option already existed; README.md now names its accepted values.
- Added short `--target` aliases (`win-x64`, `win-arm64`, `mac-x64`, `mac-arm64`) while retaining the original names and output ZIP filenames. Parser checks passed for all aliases, original names, defaults and invalid input; no distribution rebuild was performed.
- Kept START_HERE.html's explicit Windows and Mac starter names after review, avoiding confusion with the guide's own filename. Script syntax, launcher/reference presence and guide wording checks passed. The distribution ZIPs were not rebuilt, so they still contain the prior Stop names.

## 2026-11-14 — platform release archives

- The default release build now creates Windows x64 and Mac Intel ZIPs, each with one pinned Node runtime, its own Start/Stop files, reduced runtime checksums and a .sha256 sidecar. The old combined ZIP and checksum were removed. ARM64 manifest entries remain available for explicit targets, but no ARM64 package is built by default. Starters on ARM64 report that no package exists yet; emulation was not verified.
- Both ZIPs passed the release audit (`textFiles: 5455`, `workbooks: 1`, `ok: true`) and the release test's checksum, current app files, runtime folder, launcher and Mac permission checks. On Windows x64, the extracted package passed Start/Stop without global Node, repeat launch, empty inventory, self-check and Excel download. The ZIPs are 47,058,433 bytes (Windows) and 52,768,267 bytes (Mac).
- `npm test` passed 57/57 importer cases and 15 portable integration checks after correcting a pre-existing print fixture that incorrectly expected generated status text while setting a manual override. Mac execution and ARM64 emulation were not tested on this Windows x64 computer.

## 2026-11-14 — Reset sorting

- Confirmed and ported ClaudeCodeLocal 8d636ce: Reset restores normal columns before setting Actions descending, so remembered In progress/column sorts cannot override the default. Search clearing, default status exclusions and draft protection remain.
- Synthetic Chrome checks passed for reversed Actions, ascending In progress dates, restored custom columns, cleared filters, Urgent/Shortlisted priority, reload and rejected draft discard.

## 2026-11-14 — compact toolbar actions

- Matched Reset and Columns to Settings at 30 px, retaining 37 px search/preset controls. Chrome verified desktop/narrow sizing, alignment, menu placement and Reset.

## 2026-11-14 — manual application wording

- Ported ClaudeCodeLocal 0b3b974 manual status-text behaviour: exact wording or an intentional blank replaces generated history in the editor and saved-data Excel/PDF exports. Notes preserve it; real stage/date changes regenerate defaults unless explicitly overridden. Date changes preview defaults; drafts and Undo remain supported.
- API/export regressions and synthetic Chrome checks passed for exact/blank text, notes, reload, date/stage changes, manual draft precedence, calendar clear/Cancel and Undo. Existing heading/layout retained; no new JSON fields.

## 2026-11-14 — date-clear controls

- Ported ClaudeCodeLocal 19d042e: accessible clear crosses beside Application, Interview, Offer and Outcome dates. Clears remain drafts until Save; Cancel restores them. Empty and pending-save controls are disabled; native calendars remain.
- Offer date matches one picker-column width, with consistent 10 px gaps above standalone dates. Renamed Your next step to Application steps. Synthetic-data Chrome verified keyboard/focus, 32 px geometry, half-width Offer, draft/Cancel, pending saves, reload persistence and stage visibility.

## 2026-11-14 — column checklist filters

- Inactive checklists start unchecked for one-click selection. Clear removes the selection; All selects every option. Both keep the popup open, and complete/empty selections leave the header neutral. Fresh views and Reset retain New, Shortlisted, Applied, Interview and Offer.
- Existing saved views remain compatible. Model and native Chrome-click checks cover one-click/partial/all/empty selection, popup persistence, presets, text Clear and reload.

## 2026-11-14 — count labels

- All count labels use sentence case. Order remains: Positions collected, Applications in progress, Shortlisted, Urgent, New.

## 2026-11-14 — count box order

- Ordered the count boxes: Positions collected, Applications in progress, Shortlisted, Urgent, New. Chrome verified desktop/narrow visual order and all five filter actions.

## 2026-11-14 — simplified search row

- Removed the Found since toolbar shortcuts and their handlers. The count follows the preset group; Reset and Columns stay together at the right edge. Search uses up to 50% of the toolbar width and takes a full row at window widths of 850 px or less.
- First found column date filtering remains available with the label Found since. Chrome verified responsive sizing and action alignment from 320 to 1800 px, stable widths with search/clear/Reset and presets, date filtering/reload and status autosave, including the Applied shortcut.

## 2026-11-14 — preset spacing

- Added 4 px outer margin per side of the preset group, producing 12 px gaps to neighbouring controls on the same row. Chrome verified desktop gaps, unchanged 37 px height and no page overflow at 390/1280 px.

## 2026-11-13 — consistent outlines

- Shared #cfdacf across neutral control outlines, count box borders/dividers, preset/export dividers, the table frame, header underline and column-filter popup. Internal table lines stay lighter.
- Headless Chrome verified border colours, 1 px table structural edges, unchanged internal separators, popup rendering and desktop/narrow layouts.

## 2026-11-13 — toolbar sizing

- Matched toolbar controls to the 37 px search field, retained text sizes and added side padding to New, All and Reset. Adjusted Columns menu placement.
- Headless Chrome checks passed at desktop and narrow widths for dimensions, padding, overflow and filter actions; rendering inspected.

## 2026-11-13 — rejection after interview

- Rejected position titles are regular, with bold titles and Interview -> Rejected for recorded interview rejections. Links and plain text follow the same rule.
- Added Rejected after Interview to the Status filter as a subgroup of the overall Rejected selection, using existing JSON history fields.
- Model and headless Chrome checks passed for older records, filtering/persistence, All/Reset, live updates and Undo.

## 2026-11-12 — Applied shortcut and count filters

- New and Shortlisted editors have an Applied shortcut using the existing status autosave, date and Undo flow.
- Count boxes trigger the corresponding quick filters with neutral backgrounds. The Urgent count filters flagged positions across all statuses; the toolbar retains four buttons.
- Headless Chrome verified filter parity, persistence, draft preservation, shortcut visibility, Undo, keyboard use and narrow layout. Existing view-model checks passed.

## 2026-11-12 — guide and launcher naming

- Renamed the recipient guide to START_HERE.html and starters to Start (Windows).cmd and Start (Mac).command; updated documentation, release builder and release-test references without rebuilding the ZIP.
- Shortened everyday instructions, removed redundant prerequisites, and directed search changes back to the existing setup chat. Static guide/template/filename checks and release-script syntax checks passed; renamed-launcher execution and updated rendering remain untested.

## 2026-11-11 — recipient guide and search coverage

- Added a Before you start box to START_HERE.html with assistant/app, Gmail, CV and setup-time prerequisites. Removed the separate test-before-scheduling instruction; the guide now follows setup's scheduled-task test order.
- Documented the existing Excel/PDF controls, shared export language and optional report name. Added the agent-owned coverage fields, including dropped-role retention and LinkedIn access results, to SEARCH_WORKFLOW.md.
- Static checks passed for HTML IDs, copy targets, local links, script syntax and source/template parity. Headless Chrome failed to launch (exit -2147483645); visual and scheduled-task acceptance remain pending.

## 2026-11-11 — urgent row markers

- Ported ClaudeCodeLocal JobTracker commit 5b4596a. Urgent positions use the urgency symbol’s red for a 3 px left edge in collapsed and expanded rows, taking precedence over status edge colours.
- Headless Chrome verified New, Interview and Offer, clearing urgency, status dismissal, Undo and the In progress view.

## 2026-11-11 — selecting row text

- Dragging over linked or plain row text preserves selection for copying. Ordinary clicks still expand/collapse rows or open position links, and explicit buttons remain usable.
- Real drag gestures and row/link/action clicks passed in headless Chrome and Firefox. Chrome also verified keyboard expansion after selection.

## 2026-11-11 — In progress layout

- Added Applied on with date filtering. In progress hides Actions, shows Applied on and starts with newest applications first, with unknown dates last.
- Applied on, First found and Posted display dates as D MMM YYYY. Relative posting text is preserved.
- Leaving restores the prior columns and sort. Both layouts survive reload and server restart, including existing filter-only state.
- Targeted model/API checks and headless Chrome/Firefox checks passed for sorting, date edits, view switching, persistence, draft protection and narrow layout.

## 2026-11-10 — column filter shortcuts

- Added a one-click × with a 25 px hit area, keyboard focus return and saved filter state.
- Made active highlights square and continuous. Aligned left-aligned headings with row cells and the clear glyph with capital letters.
- Capped Fit at 80 px, Actions at 114 px and Country at 124 px. Fit uses the shared 12 px left inset. Centered plus/minus controls in a 44 px column. Country pairs wrap, and text columns receive extra width.
- Headless Chrome and Firefox verified controls, sizing, alignment, resizing, hidden columns and draft preservation.

## 2026-11-10 — dismissal

- Dismissing an urgent position clears its urgency in the same save. Undo restores both values. API and headless Chrome checks passed. Pushed [5464936](https://github.com/b-mishas/ApplicationTracker/commit/546493687d5a83a47688be5d916d049dd5219490).

## 2026-11-07 — Undo

- Added one-step Undo for saved position edits and quick actions, using the existing revision and backup checks. Added a curved-arrow icon and one-second grey text feedback beside Undo with stable header geometry. Source and headless Chrome tests passed. Pushed [132ff2a](https://github.com/b-mishas/ApplicationTracker/commit/132ff2a112cda94a76d5812460ee3d4e3913ddbe).

## 2026-11-07 — overview and filters

- Added the New count after Shortlisted. Headless Chrome verified that it updates when shortlisting and counts across table filters.
- Added the Applied preset for Applied, Interview and Offer, with a narrower search field when needed. Chrome verified filter persistence and responsive layout. Pushed both UI changes in [0c38cb9](https://github.com/b-mishas/ApplicationTracker/commit/0c38cb939440d0efd3315a19be93ad174b510db0).
- Removed the Active button and renamed Applied to In progress. The default and Reset views retain the original five-status selection. Pushed [a39b7ea](https://github.com/b-mishas/ApplicationTracker/commit/a39b7ea2f48fafde5638b3298d74063fc353cbb5).

## 2026-11-06 — Windows rehearsal follow-up

- Aligned settings and workbook JSON input with the importer’s UTF-8 BOM support. Documented how to set and verify the import timezone in PowerShell when Git Bash drops it. Source tests passed, including 15 portable integration checks.
- Verified the release builder’s runtime stage in Git Bash with all four runtime archives and a locked Windows executable. The builder uses Windows tar and preserves a running checkout executable while selecting the pinned runtime for the archive. Windows follow-up committed in [85be9ae](https://github.com/b-mishas/ApplicationTracker/commit/85be9ae48f698f221965731c4430ab0e5665396e).

## 2026-11-05 to 2026-11-06 — tracker workflow and exports

- Made groups and countries record-driven and dates local. Bundled country flags with UK mapped to GB. Kept automatic Fit and Group colours, with stable group assignments and an Oklab palette tested for the first eight colours. Added five ignored development positions.
- Added immediate status and outcome saving with draft preservation, separate interview/offer milestones, and dated export history. Added the New, Shortlisted, Active and All presets, persistent filters and the Urgent count. Applied uses gold-brown text, Interview uses green text and edge, Offer uses a green fill, gold accent and dollar badge, and Rejected uses grey text. Row edges share a 3 px width.
- Made Windows Start restart only its own tracker installation. Fixed Firefox's filter calendar jitter during status saves.
- Grouped Excel and PDF exports. Both share saved rows, localized titles and an optional name. PDF uses A4 landscape with repeating headers. Moved Settings to the far right and added the JSON export tooltip.
- Pushed tracker commit [`82dc7d3`](https://github.com/b-mishas/ApplicationTracker/commit/82dc7d3bb88c0b62da02609e4753c6c42bd6d0c4) to `main`. Source checks passed 57 importer cases, view-model, palette and API checks, and 14 portable integration checks. Headless Chrome verified the editor and exports, including a six-page landscape PDF. Headless Firefox verified calendar stability.

## 2026-11-05 — portable package and onboarding

- Renamed the local and GitHub repositories to ApplicationTracker and kept the `JOBTRACKER_*` environment variables. Added bundled Windows/macOS runtimes, launchers, self-check, ExcelJS export and employer workbook tools, and a pristine-template ZIP builder and audit (`45f07a3`).
- Verified an earlier ZIP on Windows x64 from a clean extraction without global Node. Start and repeat launch, empty inventory, self-check, Excel download, Stop and privacy audit passed. Verified all four runtime hashes and macOS executable permissions.
- Committed agent setup, routine, templates and adjustable fit guidance (`a030d28`, `1fb3caa`, `4e13896`). Consolidated onboarding into `START_HERE.html` and added four copyable chatbot prompts.

## 2026-11-04 — standalone tracker

- Created the separate JobTracker repository (`0f7ad2b`) with pristine agent, guide and profile templates. Used installation-relative data and initialization that preserves an existing inventory. Verified importer, view model, API saves and repeat initialization on Windows.
