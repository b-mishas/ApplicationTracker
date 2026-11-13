# Application tracker checkpoint

Updated 2026-11-13 20:54 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main at cfaacb0, one local commit ahead of origin/main. Remote and CI unverified for this turn. No active operations. The requested rejection feature was committed locally as cfaacb0.

## Latest local commit

- app/status-history.mjs derives rejection after interview from effectiveStatus and the existing interviewDetails helper, supporting current milestone fields and older history/outcome records.
- app/app.js marks those rows and expanded details with rejected-after-interview, displays Interview -> Rejected, and adds Rejected after Interview to the Status filter checklist. The edit dropdown and saved job status retain the existing status values.
- app/view-model.mjs gives interview rejections both the Rejected and subgroup filter values. The overall Rejected filter still includes every rejection. Preset matching accounts for the redundant subgroup when all rejections are selected.
- app/style.css sets ordinary rejected position titles to weight 400 and interview-rejected titles to 650 for links and plain text. Autosave updates the class and label in place; Undo derives them again.
- app/test-view-model.mjs and HISTORY.md record the regression cases and completed behavior. Only the five rejection-feature app files and their own HISTORY.md entry were committed. Earlier history/guide edits and this checkpoint remain local.

## Verification

The view-model suite passed for current/legacy records, unknown interview dates, stale outcomes, subgroup/overall filters and All/Reset selections. Headless Chrome verified linked/plain title weights and grey colours, both legacy representations, filter reload persistence, preset matching, outcome/status autosave, class removal on reapplication and Undo. A screenshot verified rendering. Syntax and focused diff whitespace checks passed. Firefox and physical-device acceptance were outside this pass.

## Preserved work and next steps

The guide and agent changes are being committed as requested. START_HERE.html and launcher renames, coverage documentation, release-script references and Claude’s agent/guides/profile/templates/interface revisions remain local. Preserve those edits and their template parity. Guide rendering/copy, renamed-launcher execution and scheduled-run acceptance remain pending.

Review the rejection feature. See PLAN.md for guide review, scheduled-run rehearsal, platform checks and recipient acceptance. No release rebuild was performed.
