# Application tracker — history

[PLAN.md](PLAN.md) lists remaining work. [HANDOFF.md](HANDOFF.md) records the latest verification details.

## 2026-11-04 — standalone tracker

- Created the separate JobTracker repository (`0f7ad2b`) with pristine agent, guide and profile templates. Used installation-relative data and initialization that preserves an existing inventory. Verified importer, view model, API saves and repeat initialization on Windows.

## 2026-11-05 — portable package and onboarding

- Renamed the local and GitHub repositories to ApplicationTracker and kept the `JOBTRACKER_*` environment variables. Added bundled Windows/macOS runtimes, launchers, self-check, ExcelJS export and employer workbook tools, and a pristine-template ZIP builder and audit (`45f07a3`).
- Verified an earlier ZIP on Windows x64 from a clean extraction without global Node. Start and repeat launch, empty inventory, self-check, Excel download, Stop and privacy audit passed. Verified all four runtime hashes and macOS executable permissions.
- Committed agent setup, routine, templates and adjustable fit guidance (`a030d28`, `1fb3caa`, `4e13896`). Consolidated onboarding into `READ ME.html` and added four copyable chatbot prompts.

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

- Replaced the active-filter dot with a one-click × in a 25 px-wide button in column headers. Headless Chrome verified independent clearing, keyboard focus, saved filter state and spacing across all columns.
