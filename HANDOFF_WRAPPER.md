# Wrapper handoff

Updated 2026-11-27T05:15:54Z — Codex.

## Scope and checkout

Ported verified deadlines and current Interviews from JobTracker c381bde2f7cd479e7ac6b72e464e5299da324f95 and b59ce2bb58ec0322b92c35b76594d1c69394f115. Actual checkout is main, HEAD/upstream origin/main c00e12def26753309b9a29a82bee3b859e6789f4 (local ref); remote/CI unverified. This corrects the previous handoff's stale feature-branch statement. Feature port remains uncommitted. User authorized a separate documentation commit: WRAPPER_PORTING.md plus AGENTS.md/CLAUDE.md references and scoped history. The guide now covers compare-before-patching, field contracts and early browser-tooling verification. Links and whitespace passed. No push/build requested.

## Implementation and files

app/app.js, index.html and style.css show valid deadlines in bold dark red and add conditional Interviews beneath Applied. Entry editor/form support optional calendar-date correction; Availability is hidden but retained as protected evidence. Batch schema/importer accept applicationDeadline and merge newer nonblank observations with applicationDeadlineAt; older/unknown dates preserve known values. No inventory migration. column-layout.mjs registers the independent Interviews layout (Applied on/Last interview, newest application first). Responsive sidebar caching includes visibility changes. Manual urgency, execution-local dates, general-purpose fields and portable paths remain.

Tests updated: importer, entry UI helper, column layout, API check; new test-interviews-preset.mjs registered in package.json. Interface/workflow, routine/template, PLAN and HISTORY updated; agent scope is in HANDOFF_AGENT.md. Preserve separate feature-port, PLAN.md, ROADMAP.md and design/ work.

## Verification and next

Importer 62/62, editor integration/UI helper, Interviews preset, column-layout, view-model, API persistence and template checks passed. Initial sandbox EACCES for localhost was resolved with escalated fixture-only runs. Changed runtime JavaScript syntax and diff whitespace passed. Playwright module failed to load; browser visual acceptance for these features remains pending. No real data/settings or installed prompt changes; temporary test processes exited. No active operations.

Responsive c00e12d includes shrinking whole-pixel columns and collapsible/adjustable navigation; prior Chromium and Firefox fractional-scale checks passed. Physical laptop jitter, touch devices/font changes and recipient acceptance remain pending; earlier preference-save stress limitation unresolved. Next: browser/user review of both new features and physical responsive acceptance. ZIPs remain stale; see PLAN.md before any separately authorized packaging.
