# Wrapper handoff

Updated 2026-11-26T19:25:49Z - Codex.

## Scope and checkout

Responsive table/navigation feature and Astra's review fixes are included in the user-authorized local commit on feature/responsive-layout (parent 06e7e52); no upstream configured. main remains unchanged. Remote/CI unverified. No push or distribution build requested. Preserve unrelated AGENTS.md, CLAUDE.md, PLAN.md, ROADMAP.md, WRAPPER_PORTING.md and design/ changes; the reciprocal-guide HISTORY entry is excluded from this commit.

## Current implementation

app/column-layout.mjs fits automatic columns before scrolling, assigns exact whole CSS pixels and shares lower minimums with manual resizing/saved-state validation. app.js measures fractional usable space conservatively; style.css stabilizes the scrollbar gutter. Manual widths stay intact, and shrinking gestures cannot enlarge compressed columns.

At <=1600 px navigation labels compact; at <=1150 px a 44 px New/List/Applied count rail plus 10 px spacer replaces the sidebar. Only the outlined rail opens on hover; keyboard focus also opens. Pinning reserves space, and long full labels wrap rather than overlap entries. Manual full labels return to automatic on window narrowing. The 10 × 55 px centered edge control supports dragging, double-click and keyboard modes, sits outside the separator and meets results with no gap. It is hidden/disabled while collapsed. Pin state is session-only; label density persists separately from table preferences.

Rail counts mirror the sidebar (Applied includes Applied/Interview/Offer). Selection uses bold only; positive New counts have no independent bold. Full-title hints cover whole preset buttons; menu-to-New spacing is 24 px. Sidebar sizing coalesces per frame, caches by content/visibility/breakpoint, invalidates on fonts and skips unchanged writes. No current-view heading, automatic column hiding or phone cards.

## Verification and next action

Focused column, sidebar/editor-helper, view-model, syntax and isolated API checks passed. Fresh Chromium checked sizing, drag/double-click, pinning, mixed/live counts, selection, control visibility and spacing; screenshots reviewed. Firefox fractional-width tests passed at 100%/125% device scale. Physical laptop jitter, touch devices, font-change rendering and recipient acceptance remain pending; earlier preference-save stress limitation remains unresolved. No real data/settings changed; fixture processes stopped. Next: user review and physical acceptance. Release archives remain stale. No active operations.
