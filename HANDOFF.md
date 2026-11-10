# Application tracker checkpoint

Updated 2026-11-10 22:41 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main at 9f50e52, matching the local origin/main ref. Remote and CI unverified for this turn. No active operations.

## Current local work

- app/style.css gives column titles square corners and a continuous green fill with the ×. Left-aligned titles match the row cells’ 12 px inset, with 6 px for Fit. Actions and Country stay centered. Extra bottom padding in the clear button raises the glyph to match the title’s capital letters while preserving its 25 px hit area.
- app/app.js keeps Actions at 112 px, Country at 120 px, and the expand control column at 40 px. Remaining columns receive extra space in proportion to their base widths. A ResizeObserver updates only the column geometry, preserving editor drafts. When all flexible columns are hidden, the table fits the compact columns.
- Country flag/code pairs wrap intact within the capped column. Work mode and Assessment retain the earlier 6 px additions for the aligned headings and clear control.
- HISTORY.md records these verified changes. These four files, including this handoff, are unstaged.

## Verification

Headless Chrome and Firefox verified widths at 390, 1280 and 2200 px, active filter controls, country wrapping, expansion, column visibility combinations and resize with an unsaved draft. Both preserve the text columns’ original proportions. Enlarged Chrome and native Firefox screenshots put the clear glyph’s ink center within 0.5 px of the title’s center. JavaScript syntax, diff whitespace and app/test-view-model.mjs checks passed. Physical-device acceptance was outside this pass.

The preceding source commit 9f50e52 implements one-click column filter clearing with a 25 px hit area, keyboard focus return, persisted filters and draft protection. Earlier source checks covered Undo, dismissal, Windows JSON input and runtime packaging.

## Next steps

Review the local styling and width changes. See PLAN.md for the recipient guide, packaging on request, assistant rehearsals, platform acceptance and recipient trial. The existing distribution ZIP predates these source changes.
