# Application tracker — history

[PLAN.md](PLAN.md) lists remaining work. [HANDOFF.md](HANDOFF.md) records the latest verification details.

## 2026-11-12 — guide and launcher naming

- Renamed the recipient guide to START_HERE.html and starters to Start (Windows).cmd and Start (Mac).command; updated documentation, release builder and release-test references without rebuilding the ZIP.
- Shortened everyday instructions, removed redundant prerequisites, and directed search changes back to the existing setup chat. Static guide/template/filename checks and release-script syntax checks passed; renamed-launcher execution and updated rendering remain untested.

## 2026-11-11 — recipient guide and search coverage

- Added a Before you start box to START_HERE.html with assistant/app, Gmail, CV and setup-time prerequisites. Removed the separate test-before-scheduling instruction; the guide now follows setup's scheduled-task test order.
- Documented the existing Excel/PDF controls, shared export language and optional report name. Added the agent-owned coverage fields, including dropped-role retention and LinkedIn access results, to SEARCH_WORKFLOW.md.
- Static checks passed for HTML IDs, copy targets, local links, script syntax and source/template parity. Headless Chrome failed to launch (exit -2147483645); visual and scheduled-task acceptance remain pending.

## 2026-11-04 — standalone tracker

- Created the separate JobTracker repository (`0f7ad2b`) with pristine agent, guide and profile templates. Used installation-relative data and initialization that preserves an existing inventory. Verified importer, view model, API saves and repeat initialization on Windows.

## 2026-11-05 — portable package and onboarding

- Renamed the local and GitHub repositories to ApplicationTracker and kept the `JOBTRACKER_*` environment variables. Added bundled Windows/macOS runtimes, launchers, self-check, ExcelJS export and employer workbook tools, and a pristine-template ZIP builder and audit (`45f07a3`).
- Verified an earlier ZIP on Windows x64 from a clean extraction without global Node. Start and repeat launch, empty inventory, self-check, Excel download, Stop and privacy audit passed. Verified all four runtime hashes and macOS executable permissions.
- Committed agent setup, routine, templates and adjustable fit guidance (`a030d28`, `1fb3caa`, `4e13896`). Consolidated onboarding into `START_HERE.html` and added four copyable chatbot prompts.

## 2026-11-05 to 2026-11-06 — tracker workflow and exports

- Made groups and countries record-driven and dates local. Bundled country flags with UK mapped to GB. Kept automatic Fit and Group colours, with stable group assignments and an Oklab palette tested for the first eight colours. Added five ignored development positions.
- Added immediate status and outcome saving with draft preservation, separate interview/offer milestones, and dated export history. Added the New, Shortlisted, Active and All presets, persistent filters and the Urgent count. Applied uses gold-brown text, Interview uses green text and edge, Offer uses a green fill, gold accent and dollar badge, and Rejected uses grey text. Row edges share a 3 px width.
- Made Windows Start restart only its own tracker installation. Fixed Firefox's filter calendar jitter during status saves.
- Grouped Excel and PDF exports. Both share saved rows, localized titles and an optional name. PDF uses A4 landscape with repeating headers. Moved Settings to the far right and added the JSON export tooltip.
- Pushed tracker commit [`82dc7d3`](https://github.com/b-mishas/ApplicationTracker/commit/82dc7d3bb88c0b62da02609e4753c6c42bd6d0c4) to `main`. Source checks passed 57 importer cases, view-model, palette and API checks, and 14 portable integration checks. Headless Chrome verified the editor and exports, including a six-page landscape PDF. Headless Firefox verified calendar stability.

## 2026-11-06 — Windows rehearsal follow-up

- Aligned settings and workbook JSON input with the importer’s UTF-8 BOM support. Documented how to set and verify the import timezone in PowerShell when Git Bash drops it. Source tests passed, including 15 portable integration checks.
- Verified the release builder’s runtime stage in Git Bash with all four runtime archives and a locked Windows executable. The builder uses Windows tar and preserves a running checkout executable while selecting the pinned runtime for the archive. Windows follow-up committed in [85be9ae](https://github.com/b-mishas/ApplicationTracker/commit/85be9ae48f698f221965731c4430ab0e5665396e).

## 2026-11-07 — overview and filters

- Added the New count after Shortlisted. Headless Chrome verified that it updates when shortlisting and counts across table filters.
- Added the Applied preset for Applied, Interview and Offer, with a narrower search field when needed. Chrome verified filter persistence and responsive layout. Pushed both UI changes in [0c38cb9](https://github.com/b-mishas/ApplicationTracker/commit/0c38cb939440d0efd3315a19be93ad174b510db0).
- Removed the Active button and renamed Applied to In progress. The default and Reset views retain the original five-status selection. Pushed [a39b7ea](https://github.com/b-mishas/ApplicationTracker/commit/a39b7ea2f48fafde5638b3298d74063fc353cbb5).

## 2026-11-07 — Undo

- Added one-step Undo for saved position edits and quick actions, using the existing revision and backup checks. Added a curved-arrow icon and one-second grey text feedback beside Undo with stable header geometry. Source and headless Chrome tests passed. Pushed [132ff2a](https://github.com/b-mishas/ApplicationTracker/commit/132ff2a112cda94a76d5812460ee3d4e3913ddbe).

## 2026-11-10 — dismissal

- Dismissing an urgent position clears its urgency in the same save. Undo restores both values. API and headless Chrome checks passed. Pushed [5464936](https://github.com/b-mishas/ApplicationTracker/commit/546493687d5a83a47688be5d916d049dd5219490).

## 2026-11-10 — column filter shortcuts

- Added a one-click × with a 25 px hit area, keyboard focus return and saved filter state.
- Made active highlights square and continuous. Aligned left-aligned headings with row cells and the clear glyph with capital letters.
- Capped Fit at 80 px, Actions at 114 px and Country at 124 px. Fit uses the shared 12 px left inset. Centered plus/minus controls in a 44 px column. Country pairs wrap, and text columns receive extra width.
- Headless Chrome and Firefox verified controls, sizing, alignment, resizing, hidden columns and draft preservation.

## 2026-11-11 — In progress layout

- Added Applied on with date filtering. In progress hides Actions, shows Applied on and starts with newest applications first, with unknown dates last.
- Applied on, First found and Posted display dates as D MMM YYYY. Relative posting text is preserved.
- Leaving restores the prior columns and sort. Both layouts survive reload and server restart, including existing filter-only state.
- Targeted model/API checks and headless Chrome/Firefox checks passed for sorting, date edits, view switching, persistence, draft protection and narrow layout.

## 2026-11-11 — selecting row text

- Dragging over linked or plain row text preserves selection for copying. Ordinary clicks still expand/collapse rows or open position links, and explicit buttons remain usable.
- Real drag gestures and row/link/action clicks passed in headless Chrome and Firefox. Chrome also verified keyboard expansion after selection.

## 2026-11-11 — urgent row markers

- Ported ClaudeCodeLocal JobTracker commit 5b4596a. Urgent positions use the urgency symbol’s red for a 3 px left edge in collapsed and expanded rows, taking precedence over status edge colours.
- Headless Chrome verified New, Interview and Offer, clearing urgency, status dismissal, Undo and the In progress view.

## 2026-11-12 — Applied shortcut and count filters

- New and Shortlisted editors have an Applied shortcut using the existing status autosave, date and Undo flow.
- Count boxes trigger the corresponding quick filters with neutral backgrounds. The Urgent count filters flagged positions across all statuses; the toolbar retains four buttons.
- Headless Chrome verified filter parity, persistence, draft preservation, shortcut visibility, Undo, keyboard use and narrow layout. Existing view-model checks passed.

## 2026-11-13 — rejection after interview

- Rejected position titles are regular, with bold titles and Interview -> Rejected for recorded interview rejections. Links and plain text follow the same rule.
- Added Rejected after Interview to the Status filter as a subgroup of the overall Rejected selection, using existing JSON history fields.
- Model and headless Chrome checks passed for older records, filtering/persistence, All/Reset, live updates and Undo.

## 2026-11-13 — toolbar sizing

- Matched toolbar controls to the 37 px search field, retained text sizes and added side padding to New, All and Reset. Adjusted Columns menu placement.
- Headless Chrome checks passed at desktop and narrow widths for dimensions, padding, overflow and filter actions; rendering inspected.

## 2026-11-13 — consistent outlines

- Shared #cfdacf across neutral control outlines, count box borders/dividers, preset/export dividers, the table frame, header underline and column-filter popup. Internal table lines stay lighter.
- Headless Chrome verified border colours, 1 px table structural edges, unchanged internal separators, popup rendering and desktop/narrow layouts.

## 2026-11-14 — preset spacing

- Added 4 px outer margin per side of the preset group, producing 12 px gaps to neighbouring controls on the same row. Chrome verified desktop gaps, unchanged 37 px height and no page overflow at 390/1280 px.

## 2026-11-14 — simplified search row

- Removed the Found since toolbar shortcuts and their handlers. The count follows the preset group; Reset and Columns stay together at the right edge. Search uses up to 50% of the toolbar width and takes a full row at window widths of 850 px or less.
- First found column date filtering remains available with the label Found since. Chrome verified responsive sizing and action alignment from 320 to 1800 px, stable widths with search/clear/Reset and presets, date filtering/reload and status autosave, including the Applied shortcut.

## 2026-11-14 — count box order

- Ordered the count boxes: Positions collected, Applications in progress, Shortlisted, Urgent, New. Chrome verified desktop/narrow visual order and all five filter actions.

## 2026-11-14 — count labels

- All count labels use sentence case. Order remains: Positions collected, Applications in progress, Shortlisted, Urgent, New.

## 2026-11-14 — column checklist filters

- Inactive checklists start unchecked for one-click selection. Clear removes the selection; All selects every option. Both keep the popup open, and complete/empty selections leave the header neutral. Fresh views and Reset retain New, Shortlisted, Applied, Interview and Offer.
- Existing saved views remain compatible. Model and native Chrome-click checks cover one-click/partial/all/empty selection, popup persistence, presets, text Clear and reload.

## 2026-11-14 — compact toolbar actions

- Matched Reset and Columns to Settings at 30 px, retaining 37 px search/preset controls. Chrome verified desktop/narrow sizing, alignment, menu placement and Reset.

## 2026-11-14 — date-clear controls

- Ported ClaudeCodeLocal 19d042e: accessible clear crosses beside Application, Interview, Offer and Outcome dates. Clears remain drafts until Save; Cancel restores them. Empty and pending-save controls are disabled; native calendars remain.
- Offer date matches one picker-column width, with consistent 10 px gaps above standalone dates. Renamed Your next step to Application steps. Synthetic-data Chrome verified keyboard/focus, 32 px geometry, half-width Offer, draft/Cancel, pending saves, reload persistence and stage visibility.

## 2026-11-14 — manual application wording

- Ported ClaudeCodeLocal 0b3b974 manual status-text behaviour: exact wording or an intentional blank replaces generated history in the editor and saved-data Excel/PDF exports. Notes preserve it; real stage/date changes regenerate defaults unless explicitly overridden. Date changes preview defaults; drafts and Undo remain supported.
- API/export regressions and synthetic Chrome checks passed for exact/blank text, notes, reload, date/stage changes, manual draft precedence, calendar clear/Cancel and Undo. Existing heading/layout retained; no new JSON fields.

## 2026-11-14 — Reset sorting

- Confirmed and ported ClaudeCodeLocal 8d636ce: Reset restores normal columns before setting Actions descending, so remembered In progress/column sorts cannot override the default. Search clearing, default status exclusions and draft protection remain.
- Synthetic Chrome checks passed for reversed Actions, ascending In progress dates, restored custom columns, cleared filters, Urgent/Shortlisted priority, reload and rejected draft discard.
