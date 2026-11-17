# Wrapper handoff

Updated 2026-11-17 23:43 UTC (2026-11-18 Berlin), Codex. Scope: commit the verified sidebar implementation on design/sidebar. Checkout C:/Users/misha/Claude/ApplicationTracker. The sidebar commit containing this snapshot has parent 8bd25a0 and the branch has no upstream. Remote and CI are unverified. No test operations remain active. The normal tracker server was last verified at http://127.0.0.1:56068 during the earlier Offers fix.

## Delivered wrapper changes

The app uses a compact Pipeline and Statistics sidebar in place of the overview and toolbar presets. Applied retains the prior In progress layout and membership. On narrow screens the sidebar sections sit above the table. Applied positions have Rejected and Interview shortcuts with autosave, draft preservation and Undo. Application steps use consistent spacing, the Status checklist uses plain Applied and Interview labels, and the export setting reads Language for export.

Interview invites counts valid interview dates. Explicitly cleared dates override legacy dates, and backward stage corrections clear later milestones. Offers counts current effective Offer status even when its date is empty, and hides at zero. The model and frontend share this predicate. App changes cover the markup, CSS, controller, view model, milestone logic, schema descriptions and focused tests. SEARCH_WORKFLOW, INTERFACE_FOR_TRACKER, PLAN and HISTORY document the shipped behavior and the ten local development mocks. Runtime records and settings remain outside Git. The design sketches and routine-cost review remain separate local work.

## Verification and next action

Model tests, the isolated API suite, JavaScript syntax and staged whitespace checks passed before commit. Earlier in-app Chromium checks covered desktop and 390 px layout, navigation, status shortcuts, reload, Undo and milestone correction. The latest Offers browser check returned exactly one current offer in the ten-mock inventory. Firefox, Safari, physical-device and recipient acceptance remain untested. Existing distribution archives predate this change. The sidebar branch is ready for review. Release and platform acceptance work remains in PLAN.md.
