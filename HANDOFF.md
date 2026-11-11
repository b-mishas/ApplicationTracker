# Application tracker checkpoint

Updated 2026-11-11 02:22 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main. This checkpoint accompanies the date-format commit, based on 67dfb52. Local origin/main matched that base at the start. Push pending at the time of writing. CI unverified. No background operations.

## Date display

Applied on, First found and Posted display full dates as D MMM YYYY, for example 8 Nov 2026. app/app.js reads ISO components directly and uses English three-letter month names, avoiding timezone shifts. Relative or free-text posting dates are preserved. Missing dates display an em dash.

The commit includes app/app.js, HISTORY.md and this checkpoint. The attempted Applied gold edge was reverted before this commit.

## Verification

Headless Chrome checked all three date columns, leap days, Sep, unknown and relative dates, date inputs, chronological sorting and ISO filters across different timezones and a German browser locale. The rendered dates were inspected in a screenshot. View-model, JavaScript syntax and diff whitespace checks passed. Physical-device acceptance was outside this pass.

## Previous feature and next steps

67dfb52 contains the In progress layout. Entering saves the normal columns and sort, hides Actions, shows Applied on and sorts newest first. Leaving restores the snapshot, including after reload or server restart. Headless Chrome/Firefox and targeted API checks passed for those transitions and draft protection.

See PLAN.md for the recipient guide, packaging on request, assistant rehearsals, supported-platform acceptance and recipient trial. The existing ZIP predates recent source changes.
