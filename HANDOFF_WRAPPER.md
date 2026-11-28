# Wrapper handoff

Updated 2026-11-28T08:18:52Z — Codex.

## Scope and checkout

Port the relevant features of four pinned JobTracker commits using WRAPPER_PORTING.md. Destination main, pre-final-commit HEAD 943aabb. User requested three commits: ba78173 contains source types/Interviews; 943aabb contains compact responsive controls; this checkpoint accompanies the date-clearing commit. Locally recorded origin/main is 4931d22; no push requested. Remote/CI unverified. Source read-only at c9e75e0f4981d35b26df9440d1e3f217f05c60e0; full source SHAs and decisions are in HISTORY.md. Commit authorized; no push/build requested.

## Implemented

e15d33c was already present: aliases/derived country hidden, evidence basis protected and Sources spacing/Applied font weight correct. Ported 85fd966: optional per-source link types, primary synchronization, neutral unknown-source labels, importer validation/enrichment and current Interviews including Offers. Ported c802981: compact 145 px Status/date fields, consistent spacing and outcome buttons. Added container-based stacking/wrapping for this wrapper's narrow responsive panels. Ported c9e75e0: clearing a recorded date on Applied returns it to Shortlisted; normal view autosaves, full Edit stages until Save. Clear/reapply, Cancel, failure recovery, notes, Undo and later-status exemptions are covered.

Changed wrapper files: app.js, style.css, entry-form/editor, status-history, importer, batch/inventory schemas and affected UI/editor/import/view-model/Interviews/check tests. Updated INTERFACE_FOR_TRACKER.md, app/SEARCH_WORKFLOW.md and the optional-field sentence in routine/pristine template. No new runtime modules/dependencies or migration; curated release list already includes affected modules. Portable settings, general-purpose countries/groups, local dates and Excel/PDF implementation retained.

## Verification and remaining work

Full npm test passed. Isolated headless Chrome 1440×1000/900×900 exercised source switching/save, Offer-only Interviews, automatic and staged date clears/reapply/Cancel and retained unsaved notes. Screenshots inspected; no browser exceptions; narrow application controls now fit their 244 px panel. CUA/Node helpers could not start because chat cwd names the old folder; temporary Chrome/CDP provided browser checks. Test browser/server/fixture stopped/removed. Firefox, touch, physical laptop and recipient acceptance remain untested; prior responsive/release limitations remain in PLAN/HISTORY.

Unrelated setup/recovery work was committed independently in b856b44; untracked design/ remains outside these commits. Installed prompts need separate regeneration. No live records/settings, login registration, running installation or ZIP changed. No active operations from this port. Next: user review; Firefox/touch/physical-device checks remain open. Remote/CI unverified.
