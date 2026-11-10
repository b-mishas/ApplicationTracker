# Application tracker checkpoint

Updated 2026-11-10 20:56 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main. This checkpoint accompanies the column filter commit, based on e06d59b. Local origin/main pointed to e06d59b before the commit. Remote and CI unverified at the time of writing.

## Column filter shortcuts

- app/app.js and app/style.css add a × after the title of a filtered column. It uses the same clear operation as the filter panel, then returns keyboard focus to the title. It keeps the sort arrow, other filters and search intact. The All status preset has no ×, and clearing a restricted Status selection selects All. The hit area is 25 px wide and the cross uses the existing 16 px font size. Narrow columns have room for the button beside the label.
- HISTORY.md records the verified UI change.

## Verification

The JavaScript syntax check and app/test-view-model.mjs passed. Headless Chrome with a disposable server verified pointer and keyboard clearing, focus return, independent filters, preserved sort and search, cleared state after reload, existing panel Clear, date filter synchronization, draft protection, and measured a 25 px clear button with a 16 px cross and no label overlap in all 13 columns at a narrow viewport. Firefox and physical-device checks were outside this pass.

## Release follow-up

The preceding checkpoint includes Windows UTF-8 BOM fixes and runtime packaging changes (85be9ae), dismissal clearing urgency (5464936), and one-step Undo (132ff2a). Earlier npm test and Git Bash packaging checks passed. The existing ZIP predates these changes.

See PLAN.md for the recipient guide, packaging on request, scheduled assistant rehearsals, platform acceptance and the recipient trial. Claude’s fictional Windows rehearsal follow-up is in cf9b3ad. The old JobTracker app preset is an app-side follow-up.
