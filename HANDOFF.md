# Application tracker checkpoint

Updated 2026-11-11 00:50 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main at 7a7797d, matching the local origin/main ref. Remote and CI unverified for this turn. No active operations.

## Current local work

- app/app.js adds Applied on after Status, using the existing applicationDate field and browser-local date formatting. Missing or invalid dates display an em dash. The date column is available in Columns and supports an applied-on-or-after filter.
- Entering the In progress status selection snapshots the current columns and sort, hides Actions, shows Applied on and sorts application dates newest first. Manual changes inside that view stay temporary. Leaving via another preset, Status filtering or Reset restores the snapshot. Column checkboxes follow the active layout.
- app/server.mjs validates optional layout and standardLayout fields in the existing saved view state, plus the new applicationDate filter. Existing filter-only state remains supported. Both the current layout and return snapshot survive reload and server restart.
- app/view-model.mjs applies date-range filtering to applicationDate. Its existing sort handles chronological ISO dates, unknown dates last and Fit ties.
- app/test-view-model.mjs, app/check.mjs and HISTORY.md record the targeted regressions and behavior. These seven files, including this handoff, are unstaged.

## Verification

View-model and isolated API checks passed, including date order, missing dates, effective interview outcomes, older view states, invalid layouts and stale writes. Headless Chrome and Firefox verified entering/leaving the view, independent customization, date filtering and editing, draft protection, reload, server restart, Reset, hidden-column transitions, legacy state and narrow layout. A Chrome screenshot verified the rendered view. Syntax and diff whitespace checks passed. Physical-device acceptance was outside this pass.

## Next steps

Review the local feature changes. See PLAN.md for the recipient guide, packaging on request, assistant rehearsals, platform acceptance and recipient trial. The distribution ZIP predates recent source changes.
