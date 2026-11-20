# Application tracker — history

[PLAN.md](PLAN.md) lists remaining work. [HANDOFF_AGENT.md](HANDOFF_AGENT.md) and [HANDOFF_WRAPPER.md](HANDOFF_WRAPPER.md) record the latest verification details. Entries are newest first; add new ones directly below the separator line.

--------------------

## 2026-11-20 — Statistics sorting (Codex)

- All Statistics presets default to application date, newest first. A one-time upgrade replaces the former default sort in saved layouts while preserving custom sorting and columns. Focused layout/model suites and isolated Chromium preset checks passed.

## 2026-11-20 — Small-model acceptance rehearsal (milestone 6)

- Ran the search routine headless on Claude Sonnet 5.5 (lead) and Haiku 5.5 as subagent model, with the state helpers (18a85df) and without them (b66c262), on three Greenhouse boards with three seeded traps. Both arms kept all 8 relevant postings, read no trap and reported exact counts. Helpers used 57% more input tokens (1.09M vs 0.69M), so the decision rule says cut further. One run per arm; recovery not exercised. Report: rehearsal/runs/2026-11-21-small-model-acceptance/evaluation/REPORT.md; details in agent/orchestration/ORCHESTRATION_HISTORY.md.

## 2026-11-20 — Known finds checked before rating

- run-state `next` marks pending finds from every source that are already in jobs.json (any status) or on the dropped list as `known`; the routine resolves them as duplicate before any reading or rating. Duplicates no longer return after a profile change. Fixture tests and full npm test pass; no agent run yet. Details in agent/orchestration/ORCHESTRATION_HISTORY.md.

## 2026-11-20 — Simplified search state helpers

- run-state.mjs reduced to init/task/read/next/summary: no revision checks, call budgets, stop/resume or import receipts. Delivery and positions added this run are read from jobs.json, so interrupted or repeated imports no longer need reconciliation. The routine is back on the direct importer; summary rules shortened and the four-sections contradiction fixed; dead setup text removed. Fixture tests pass; no agent rehearsal yet. Details: agent/orchestration/ORCHESTRATION_HISTORY.md.

## 2026-11-20 — Local rehearsal closure

- Reconciled the existing successful resumed receipt, archived exact batch bytes and completed import/coverage/summary tasks. Inventory bytes unchanged; no new import, external call or subagent. Derived summary has zero unfinished tasks and one confirmed addition.
- Verified all four narrative sections, skipped/null LinkedIn test, no employer successful date, and source/template parity. Original baseline failures preserved. Fresh-agent reporting retest not performed; resumed reporting completed by orchestrator.
- Narrow step-4 measurement concluded with limitations, not full autonomous acceptance or demonstrated savings. Existing native usage and recovery findings retained in rehearsal/runs/agent-pair-2026-11-20T16-35-39-299Z/REPORT.md.



## 2026-11-20 — Agent-pair evidence recovered after model-selection error

- Three rehearsal agents incorrectly inherited Astra. Stopped active agents; no replacement agents launched. Explicit user rule: Astra orchestrates; subagents use gpt-6.1-sol Medium explicitly, no inherited Astra.
- Audited both inventories and receipts: one fit-4 vacancy imported once in each. Preserved pre-import checkpoint; fresh resume agent reused files with zero external reads and imported successfully before interruption. Import/coverage/summary task closure remains pending.
- Baseline omitted Flags and encoded an excluded LinkedIn test as failed. Corrected source/template instructions and workflow contract; agent retest pending. Not full step-4 completion or a valid completed cost comparison.
- Evidence and native usage: rehearsal/runs/agent-pair-2026-11-20T16-35-39-299Z/REPORT.md, verification.json, native-usage.json. Recover local reporting from existing state; no discovery/import rerun needed.



## 2026-11-20 — Roadmap safeguards restored (side conversation)

- Restored plan-only maintenance rule, root history/plan pointers, essential artifact responsibilities, batch-hash/report-overwrite rationale and explicit interruption/31-day retention verification cases. Prohibited serialized conversation state explicitly.
- Defined job vacancy versus human candidate; roadmap prose now uses job vacancy, preserving code/file identifiers. Added authoritative detail locations; field/command details checked against CANDIDATE_STATE.md, RUN_STATE.md and routine evidence instructions. No runtime changes or rehearsal execution.



## 2026-11-20 — Step 4 preliminary live check

- Simplified roadmap while retaining responsibilities, invariants, milestones, acceptance and limitations.
- One live Contentful posting plus controlled continuous/resumed processing in isolated inventories: one addition each; fresh-process pending response 451 bytes; zero repeated external reads. Evidence: rehearsal/runs/orchestration-live-20261120/REPORT.md and comparison.json.
- Step 4 remains open: not separate live agents, no native token measurement, and manifest initialized after discovery. No token-saving or capture-before-discovery acceptance claim. Next: properly initialized agent-level pair.



## 2026-11-20 — Reporting verification completed (Codex)

- Expanded summary assertions across failure/recovery fixtures; twelve scenarios passed. Fixed unknown-count and coverage-summary instructions; marked roadmap milestone 3 complete. See ORCHESTRATION_HISTORY.md for limits.


## 2026-11-20 — Derived summary implemented

- Added read-only run-state summary command: ledger dispositions, task statuses, unique candidate import outcomes, unknown attempts and cross-run pending work. Updated routine/setup and pristine copies plus runtime/interface guidance. Unrecorded source metrics remain unknown; task statuses cannot prove source coverage.
- Eleven temporary-fixture recovery/reporting scenarios passed, including repeated-import counting. No live rehearsal, installed prompt update or package build. Summary reads assume one lead writer between updates.



## 2026-11-20 — Orchestration filenames standardized (Codex)

- Renamed the documents to agent/orchestration/ORCHESTRATION_HISTORY.md and ORCHESTRATION_ROADMAP.md and updated references. Documentation only; overall plan unchanged.

## 2026-11-20 — Orchestration documentation and compaction handover (Codex)

- Renamed the roadmap to agent/orchestration/ORCHESTRATION_ROADMAP.md without shortening its existing content. Added ORCHESTRATION_HISTORY.md for detailed implementation/verification records and COMPACTION.md for a continuation instruction.
- Updated links and both project rules: amend the roadmap only when the overall plan changes; routine progress belongs in the detailed history. Preserved the user-requested stop before reporting. Documentation only; no runtime changes or tests rerun.

## 2026-11-20 — Persistent search recovery (Codex)

- Added run-state.mjs and RUN_STATE.md: live task manifests, cross-run pending discovery, profile/scope/deadline/stop guards, saved cursors, immutable batch snapshots and per-attempt importer receipts. Existing importer remains the only inventory writer.
- Reconciliation recovers matching reports after interruption, preserves unknown original outcomes through retries, retains partial/ambiguous work and refuses blind retries. All evidence is retained; no destructive pruning or summary generator. Updated setup/routine and exact pristine copies, workflow/interface docs, tests and future release inclusion.
- Ten temporary-fixture recovery scenarios and candidate-ledger regression checks passed. Importer suite passed 57/57 with localhost access; its initial sandbox run had 56/57 because loopback fetch was blocked with EACCES. Syntax, template parity and whitespace checks passed. Live adherence, other platforms and token savings remain unverified. Stopped after recovery per user instruction; no commit, push, real-data change, installed automation update or ZIP rebuild.

## 2026-11-19 — Persistent candidate capture (Codex)

- Implemented versioned run-ledger capture and assessment helper, compact pending queries, conservative identity, source-occurrence merging, stale-revision checks and atomic locked writes. Added the runtime contract and focused regression suite.
- Setup initializes capture before posting reads/discovery; routine uses the helper and retains setup evidence. Suspended age-only cleanup. Updated identical pristine prompts, workflow/interface docs and future release file inclusion; no ZIP built.
- Fresh-process seven/three/four recovery, source merging, distinct IDs/shared URLs, UTF-8 BOM CLI input, stale revisions, failed-write preservation, lock refusal, dispositions and legacy preservation passed. Live adherence, other platforms, full orchestration/import recovery and token savings remain untested. No real records, installed automations, commits or pushes changed.

## 2026-11-19 — Posting access and employer coverage prompt corrections (Codex)

- Adapted the supplied JobTracker changes in the routine and identical pristine template: user-established sign-in sessions with unattended fallback, full-description access tests, task-specific delegation, employer-first company/title searches and one finder round per candidate.
- Required reconciliation of selected employers against results and follow-up for missing names/methods or unsupported access within existing limits. Did not port the deferred board fetcher or invent adapter configuration. Existing coverage schema and importer interface unchanged.
- Static consistency review, exact source/template parity and git diff --check passed. No live search, installed automation update, commit, push or ZIP rebuild; practical access/coverage improvement remains unverified.

## 2026-11-19 — State-driven orchestration roadmap (Codex)

- Recorded the rehearsal-informed design in agent/orchestration/ORCHESTRATION_ROADMAP.md: immediate candidate capture, live work state, reusable assessments, interruption/import recovery, safe retention, deterministic bookkeeping and staged verification.
- Added consultation and maintenance rules to AGENTS.md and CLAUDE.md and a PLAN.md pointer. This milestone records documentation only; helper, schema and runtime changes remain planned. No search, commit, push or package.

## 2026-11-19 — Retained rehearsal storage (Codex)

- Moved five rehearsal folders from .build-cache/ into rehearsal/runs/ and the older root sandbox into rehearsal/runs/legacy-sam-rehearsal/installation/. Added directory guides, a run index, local path mapping and a current-run pointer. Updated project report references; original evidence and prompts retain their recorded contents.
- Shared ignore rules keep run data, logs and local helpers outside Git while allowing the two guides; removed the superseded local blanket exclusion. SHA-256 checks passed for all 13,536 moved files; all 568 original data/profile/settings files unchanged. Ignore coverage and guide links verified. No new search, full-suite run, automation change, commit, push or package.

## 2026-11-19 — Review of rehearsal prompt corrections applied (Claude)

- Model rule: never a subagent on a larger model than the lead (Claude Opus/Fable, Codex Sol/Astra named); smallest unavailable → middle; no model choice → subagent without model setting. Replaces "do the work yourself", which grows the lead's context. Small-set rule generalized (up to three sources or five postings of a kind are read directly); rehearsal and employer-only clauses removed from Part B and setup. Source evidence capped at one line per source; run folders older than 30 days deleted. Coverage reconciliation shortened; setup acceptance shortened.
- Setup and Codex guide recommend Terra for the Codex automation; both guides drop "half an hour or more". PLAN: regression cases for the two missed openings, regenerate installed prompts. Static checks: agent/, guides/, profile/ equal templates/; git diff --check clean; npm test exit 0. No live run.

## 2026-11-19 — Run evidence inside the installation (Codex)

- Routine evidence, helper scripts and delegated results now use a unique `data/reports/runs/<run-id>/` folder inside ROOT, with explicit write permission and retained evidence. Setup validation also uses this folder tree, so neither workflow requires another writable folder.
- Updated source prompts, identical pristine templates and the interface path table. Template parity, path-consistency review and whitespace checks passed; no live agent or scheduled-permission test performed.

## 2026-11-19 — Sketch heading typography (Codex)

- Table headings now match wrapper-directions.html: bold 11 px Segoe UI, sentence case, normal letter spacing. Headless Chromium compared computed typography with the sketch and verified filter opening.

## 2026-11-19 — rehearsal-driven prompt corrections (Codex)

- Restricted delegated models and prohibited nested delegation; missing supported models and small employer-only workloads use direct reading. Required bounded browser recovery for JavaScript/incomplete pages, compact source/completion evidence and reconciled counters/exclusions.
- Removed setup minimum-duration assumptions and aligned acceptance with partial/deferred routine outcomes. Updated both pristine prompt copies; exact parity and whitespace checks passed. Static verification only; no live run, code/schema change, filled-prompt update or ZIP rebuild.

## 2026-11-19 — focused Terra follow-up (Codex)

- One fresh Terra agent, no helpers, Contentful only, 93 seconds: reused saved reading method and refreshed the existing Shortlisted record. Independent local comparisons verified zero additions, one update, status/notes/manual urgency preserved, other nine records unchanged, correct coverage/workbook dates, archived clean batch and original runtime hashes unchanged.
- Native agent usage: 35,109 uncached input, 373,504 cached input, 3,596 output tokens. One unrelated process-inspection attempt failed; no broader searches. Failed refresh and UI acceptance remain untested. Evidence: `rehearsal/runs/terra-followup-20261119/evidence/REPORT.md`. No code/prompt changes, commit, push or packaging.

## 2026-11-18 — isolated Terra rehearsal evaluation (Codex)

- Fictional candidate, three employers, snapshot 5c6c101: ten discoveries imported, six reviewed and four unverified. Contentful complete; Zalando/n8n partial. Independent browser review found at least two plausible missed openings and an unused browser recovery route. Search completeness failed; incomplete coverage reported honestly.
- Original runtime/personal files and copied app code unchanged; Part B identical. Nine synthetic importer checks and five offline replay/preservation checks passed, zero duplicate additions. No second live run or UI acceptance; cached-method reuse and actual Shortlisted refresh untested. Model fallback and evaluator overhead consumed excessive resources; no further agents used for final conclusions.
- Local report/evidence: `rehearsal/runs/terra-rehearsal-20261118-1416/evaluation/REPORT.md`. No production code/prompt change, commit, push or ZIP build.

## 2026-11-18 — preset layouts and Last interview (Codex)

- Added independent saved visibility, order, widths and sorting for all eight presets. Shortlisted/Urgent append Posted; New appends First found; Applied keeps Actions and appends Applied on; Applications sent omits Actions, and Interview invites/Offers received add Last interview. Applied retains newest-application-first sorting.
- Last interview derives from existing milestone/history dates, displays D MMM YYYY and supports date filtering/sorting. Cleared dates suppress legacy fallback. Legacy shared layouts remain readable; versioned one-time upgrades add Posted to saved Shortlisted layouts and Actions to saved Applied layouts while respecting later manual hiding. No inventory/import/export schema change.
- Focused layout/model and isolated API/export/Undo checks passed. Synthetic Chromium verified defaults, legacy migration, per-preset customizations, reload, derived dates, sorting/filtering, upgrade persistence, later manual hiding and narrow layouts. Backend restarted at the same address with user-data/settings hashes unchanged at restart. Other browsers/devices untested. Committed together; no push or ZIP build.

## 2026-11-18 — balanced resize highlight (Codex)

- Positioned the full 7 px resize handle inside its heading, keeping its green line centered and preventing the next heading from covering half the highlight. The last-column exception is no longer needed.
- Synthetic Chromium verified every handle lies within its heading, both edges remain reachable, actual resizing works, mouse focus clears, and keyboard/hover feedback remains. Desktop screenshot and whitespace check passed. Committed together with the approved transparent sort-arrow background.


## 2026-11-18 — neutral sort-arrow background (Codex)

- Removed the default sort-arrow area shading so it blends with the table heading. Hover and keyboard-focus feedback remain. Synthetic Chromium confirmed default transparency, hover/focus colours and working sorting; desktop screenshot and whitespace check passed. Included in the table-heading refinement commit.


## 2026-11-18 — clear resize focus after mouse use (Codex)

- Completed pointer resizing now releases the handle focus, removing the lingering green mark once the pointer leaves. Hover feedback, keyboard focus/arrow resizing and Escape cancellation remain available.
- Reproduced the defect in synthetic Chromium, then verified the fix using real Tab, arrow-key and mouse events. Existing resize/reset/draft/persistence/view-layout checks passed, including narrow layouts. Syntax and whitespace checks passed; other browsers untested.


## 2026-11-18 — resizable columns (Codex)

- Drag heading edges to resize columns. Double-click or Home restores automatic sizing; arrow keys adjust by 10 px (Shift: 50 px), Escape cancels. Shared limits protect compact controls. Manual widths stay exact while untouched columns share spare space; horizontal scrolling handles narrower windows. Widths persist per layout and survive moving/hiding columns. Expand remains fixed.
- Isolated API/export/Undo regressions passed, including independent width persistence, legacy states and invalid-width rejection. Synthetic Chromium verified actual mouse resizing, draft preservation, Escape, keyboard/reset controls, bounds, reload, Applied-view isolation, reorder/hide/show and 390/900/1600 px layouts. Desktop/narrow screenshots inspected. Other browsers and physical devices remain untested.
- Restarted the normal tracker at its existing address; version/module endpoints work and inventory, export preferences, port and view-state hashes are unchanged. No ZIP build or push.


## 2026-11-18 — draggable columns (Codex)

- Drag heading labels to reorder columns, with an insertion marker and fixed expand column. Alt+Left/Right provides keyboard movement. Existing header/filter/sort controls and hidden-column positions are preserved. Order saves with each view layout in data/view-state.json. Moving existing cells preserves expanded-editor drafts and keyboard focus.
- Isolated API regressions passed, including legacy layouts, independent orders and invalid/duplicate-order rejection. Synthetic Chromium mouse and keyboard checks passed for reorder, draft preservation, reload, hide/show, Applied-view isolation, filters and sorting. Other browsers/devices remain untested.


## 2026-11-18 — visible build version (Codex)

- Footer displays the version from package.json through /api/version. Future release builds add BUILD_INFO.json with version and UTC build time; the footer tooltip identifies that time or a source checkout. ZIP names remain unchanged.
- Isolated API/export/Undo checks, JavaScript syntax checks and synthetic Chromium footer rendering passed. Release test now checks build metadata; no ZIP was rebuilt, so packaged-build acceptance remains pending.


## 2026-11-18 — routine token-cost changes implemented (Claude)

- ROUTINE_PROMPT Part B, following Codex's review: checklist-based completion with done / not due / deferred / partial / failed states and no unlimited-effort wording; fuller subagents (mails one per started 30, postings ten, employers ten or portals two–three); employers on the smallest model only with a cached method that worked before, otherwise middle; per-source limits of fifteen tool calls or five minutes. Employers due by age (A 3, B 7, C 14 days) unless the profile says otherwise, at most twenty attempts per run in next-due order; missing career URLs five per run. Shortlisted refresh rule and weekly coverage-gap searches with catch-up. coverage.json gains employers[].lastAttempt and method, and refreshed; unfinished also records partial and deferred work.
- Profile template, CUSTOMIZE.md, app/SEARCH_WORKFLOW.md and INTERFACE_FOR_TRACKER.md updated; templates/ copies identical. Static checks only: template equality, git diff --check, npm test exit 0, and a trace of the review's cases. No live or model-comparison run.

## 2026-11-18 — routine token-cost proposal reviewed (Codex)

- Compared the current routine, profile and coverage contract with JobTracker commit 15dbda5, its handoff and board script. Recorded the complete implementation instructions and next action directly in HANDOFF_AGENT.md; the separate review file was removed as requested.
- Identified completion/cap conflicts, scheduling catch-up and refresh retry requirements, and script risks around seen IDs before processing and capped pagination. Review only: no prompt, script, runtime data or schedule changes; no measured optimized search run or distribution rebuild.

## 2026-11-18 — expanded-view Undo (Codex)

- Added Undo at the expanded view's top-right, using the same handler, shared state, icon and feedback as menu Undo. It occupies existing space through absolute positioning, preserving the original expanded height. The local button/feedback belongs only to the latest edited row; menu Undo remains global. Opening another row hides its local control, while reopening the edited row restores it.
- Synthetic Chromium checked both Undo paths, draft protection and matching feedback, consumed/hidden state, unique IDs and desktop geometry (no extra height). Cross-row checks verified ownership transfer, reopening, global Undo targeting the last edited row and same-row success feedback. Syntax/whitespace checks passed. Temporary server stopped; no real data/settings changes. Narrow layouts/other browsers untested this turn. No commit/push/ZIP build.


## 2026-11-18 — active-only Offer badge and tracker restart (Codex)

- Gold fill/outline now applies only to active Offer; inactive Offer matches the other outcome buttons. Added an active-only decorative dollar circle using the existing badge class, with equal button widths retained.
- Investigated Rejected not defaulting today: normal server process predated the backend date changes. Restarted this installation at its existing port 56068 using the standard background launcher; before/after inventory/settings hashes matched. No real records changed.
- Synthetic Chromium verified Rejected defaults to 2026-11-18 even with a blank interview date; active Offer gold/dollar, inactive neutral/no dollar, and no button overflow. Syntax/whitespace checks passed. Test server stopped; normal server remains running current backend. No commit/push/ZIP build; other browsers/platforms untested.


## 2026-11-18 — gold Offer outcome button (Codex)

- Matched the Offer shortcut to the status badge: pale-gold fill, dark-yellow outline and dark-gold text, including when selected. Equal sizing and neutral Rejected/Withdrawn selection remain.
- Synthetic desktop Chromium rendering and computed-color comparison confirmed identical button/badge colors. Whitespace check passed. Temporary test server stopped; no real data/settings changes, commit, push or ZIP build. Other browsers/platforms untested for this CSS-only change.


## 2026-11-18 — status date defaults and equal outcome buttons (Codex)

- Made interview outcome buttons equal-width in a three-column grid matching the interview date column, with 3 px side padding and neutral grey selection. Used 11 px single-line labels so Withdrawn fits without wrapping; browser measurements confirmed equal widths and no overflow.
- Applied now defaults its application date to today on a real status change, including when an older application date exists. Offer, Rejected and Withdrawn also default their dates to today. Interview leaves an unknown date empty. Explicit dates override defaults; same-status saves preserve edited/cleared dates. Centralized application-date assignment in the shared transition helper.
- Interview dates survive transitions to Offer/Rejected/Withdrawn/Dismissed and clear on New/Shortlisted/Applied. Offer dates survive Rejected/Withdrawn/Dismissed and clear on New/Shortlisted/Applied/Interview. Retained dates remain visible in Dismissed records.
- Full model transition matrix, date-default/override/clear regressions, isolated API/export/Undo checks and syntax/whitespace checks passed. Synthetic in-app Chromium checks verified today's Applied/Rejection dates, blank Interview default, retained dates on rejection and desktop equal-width/neutral-shading rendering. Temporary test server stopped. Real records/settings unchanged; normal tracker not restarted. Narrow screens, other browsers and physical platforms untested this turn. No commit/push/ZIP rebuild.


## 2026-11-18 — unified status actions and milestone totals (Codex)

- Replaced the interview outcome selector with Rejected, Offer and Withdrawn buttons beside the interview date. Buttons use the main status autosave/draft/Undo flow. New ordinary saves normalize legacy interviewOutcome into status and remove the redundant field; older records and deprecated API inputs remain readable. Rejection/withdrawal dates use the existing date field with clearer labels.
- Applications sent now uses a valid application date OR current Applied/Interview/Offer. Interview invites uses a valid interview date OR current Interview. Offers received uses a valid offer date OR current Offer, retaining dated withdrawn offers. Empty dates suppress legacy date fallback without excluding qualifying current stages. Backward corrections still clear later milestones.
- Model regressions, isolated API/export/Undo checks, JavaScript syntax and whitespace checks passed. In-app Chromium with synthetic inventory verified dateless Interview/Offer counts, dated withdrawn offers, outcome buttons, note drafts, saving, Undo, reload, Offers filter membership and desktop rendering. Local networking for the API checks required sandbox escalation; the elevated run passed. No real records/settings changed; temporary test server stopped. Other browsers, narrow screens and physical devices were not tested this turn. No commit, push or distribution rebuild.


## 2026-11-18 — sidebar navigation and application shortcuts (Codex)

- Pipeline and Statistics replace the overview and toolbar presets. Applied retains the former In progress membership and dated layout. Interview invites requires a valid interview date. Offers follows current effective Offer status, including undated offers, and appears only above zero.
- Added Applied-stage Rejected and Interview shortcuts using autosave, draft preservation and Undo. Standardized Application steps spacing, simplified Status checklist labels and renamed the export-language setting. On narrow screens, Pipeline and Statistics sit above the results.
- Clearing a milestone date writes an empty string that overrides legacy history. Moving back to New, Shortlisted or Applied clears later milestones. Five local mock scenarios cover legacy, cleared and later-stage histories. The ten mock records remain in ignored runtime data.
- Focused model and isolated API tests passed, including milestone correction, reload, exports and Undo. Earlier Chromium checks covered all eight sidebar views, shortcuts, desktop and 390 px rendering. The final Offers check displayed exactly one current offer in the ten-mock inventory.

## 2026-11-18 — separate agent and wrapper handoffs (Codex)

- Replaced the shared checkpoint with HANDOFF_AGENT.md and HANDOFF_WRAPPER.md; preserved the latest routine-cost review and unfinished wrapper context. Both assistants now select handoffs by function, including API extraction scripts under agent work, and update both only when work spans both areas. PLAN/HISTORY remain shared; the one-editor rule remains.
- Updated documentation references and release builder/audit/test exclusions. Matching-rule and link checks, all three JavaScript syntax checks, and git diff --check passed. Synthetic in-memory archive checks accepted neutral content and rejected legacy and both new handoff names; builder/test guards also matched all three. No ZIP build, runtime/platform acceptance, commit or push; existing unfinished implementation was preserved.

## 2026-11-17 — START_HERE.html: Windows/Mac views, Mac first-start steps (Claude)

- A Windows | Mac switch in step 1 preselects the reader's system from the browser; system-specific lines carry `data-os` and the other system's lines are hidden. Without JavaScript both are shown.
- The Mac view has a "First start on a Mac" block: Done, then System Settings → Privacy & Security → Open Anyway, then Open (macOS 15+), with the Control-click route for macOS 14 and older, and the same approval for Stop and Restart. "If something is blocked" links to it. The Windows view drops the "(Windows only for now)" remarks; the Mac view says start at login is not available. The copy fallback names only the reader's shortcut. Copy messages appear in the prompt header left of the Copy button instead of a line below the prompt, so copying no longer changes the box height (measured 107 px before and after). After a successful copy the prompt text dims to 45% opacity at once, together with "Copied", for 0.5 s, then fades back over 0.2 s.
- Checked in the built-in browser (Chromium, Windows): Windows preselected, switch shows only the Mac lines. The macOS steps are written from macOS 15 behaviour and have not been checked on a Mac with this package.

## 2026-11-16 — start at login: Windows only, stale entries removed (Claude)

- Settings no longer offers "Start server at login" on macOS: the API reports it as unsupported there and refuses changes, because the LaunchAgent has never run on a Mac and is expected to be blocked for folders in Documents, Desktop or Downloads. The registration code and its data-only test remain. START_HERE.html and the Settings hint say "Windows only for now".
- Each login entry is recorded with its launcher path in a per-user file outside the Startup folder (`%APPDATA%/ApplicationTracker/login-entries.json`). Every start removes entries whose launcher no longer exists, so a moved or deleted folder leaves no broken login command. Only this app's own entry names in the login folder can be deleted.
- npm test passed with new assertions: a live entry stays, a moved folder's entry is removed, a tampered registry cannot delete another file, macOS is not offered. Entries created before this change are not in the registry and are not cleaned.

## 2026-11-16 — login-start limit, Apple silicon package, launcher fixes (Claude)

- Start at login on Windows: the shortcut command omits the data and settings overrides when they are the folders next to app/, and saving is refused with a plain message when the arguments would exceed 1023 characters. Windows cuts shortcut arguments there without an error (measured with WScript.Shell on Windows 11), which previously left an enabled-looking but broken login command for install paths over about 50 characters.
- The default build and scripts/test-release.mjs now cover Application-tracker-mac-apple-silicon.zip; Mac starters name the package the processor needs. A damaged data/server-port.json falls back to the default port. A failed `--background` start appends its error to data/logs/login.log. Stop (Mac).command reports "Stop failed".
- npm test passed (new assertions for the refused long path and the damaged port file). npm run build produced three ZIPs with passing audits; node scripts/test-release.mjs passed for all three and ran the Windows x64 package. No Mac package has run on a Mac.

## 2026-11-16 — routine: link finder, re-check counter, hard rules (Claude)

- Ported from the live JobTracker routine into Part B (bfe28a2): link-finder subagent, `recheck` list in coverage.json with a three-attempt stop, Hard rules and Completion sections at the top, link-finder and re-check counts in the Coverage line. INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md name `recheck`. Text change only; no run performed.

## 2026-11-14 — grouped overview counters

- Ported ClaudeCodeLocal 1299faf: application overview groups Positions collected, Applications sent, Interviews held and Applications in progress; a separate priorities group holds Shortlisted, Urgent and New. A shared parent delegates all seven click filters; groups wrap with a 12 px gap.
- Synthetic Chrome checks passed for group order, all click actions, unchanged four toolbar presets, neutral button styling and no page overflow at 390/900/1280/1800 px. Desktop/narrow rendering inspected; existing save/Undo/export API regressions passed.

## 2026-11-14 — total interviews counter

- Ported ClaudeCodeLocal 19a25bd: clickable Interviews held counter across recorded current/legacy interviews and later outcomes; Status choices distinguish Interview (pending)/(total). Renamed the sent-applications counter to Applications sent, matching the source feature.
- Model and synthetic Chrome checks passed for legacy/outcome membership, pending-only filtering, search, reload, All/Reset and live counters after status autosave and Undo.

## 2026-11-14 — Settings editing and positioning

- Confirmed the live server still lacked /api/port-settings (404), which left the control disabled. Added explicit Restart/reload guidance for older servers and restarted the actual tracker at its existing address; inventory and export settings were byte-for-byte unchanged, and the endpoint now allows editing.
- Anchored the Settings dialog near the viewport top, with bounded height and internal scrolling. Chrome reproduced the old vertical-centering jump, then verified a stable heading/top edge during expand/collapse, actual keyboard port entry, Cancel, stale-server feedback and short/narrow-screen usability. Existing port Save/Cancel/conflict browser checks still pass.

## 2026-11-14 — local port Settings

- Added Advanced Settings with a validated Local port, clickable current address and pending-Restart guidance. Saves are revision-protected and leave the server running; Cancel changes nothing. Export settings and position JSON remain unchanged.
- Restart checks the requested port before stopping the server and attempts to restore the old address on a later launch failure. Start/Restart files offer replacement-port input or cancellation when blocked; background login never prompts. The prompt releases the installation lock while waiting. Updated guide, interface and release file list without rebuilding archives.
- Isolated port/API/prompt and existing startup regressions passed, including actual Windows launchers and temporary login registration. Chrome verified validation, occupied-port rejection, Cancel/Save, pending values/current address and desktop/390 px layouts. Existing API regressions passed; actual macOS execution/login and recipient acceptance remain pending.

## 2026-11-14 — total applications counter

- Ported ClaudeCodeLocal edc13d6: clickable total sent-applications counter and Applied (pending)/(total) Status choices. Totals include later outcomes and legacy application/interview history, using existing JSON fields. Other filters, All/Reset and view persistence remain compatible.
- Model regressions and synthetic Chrome checks passed for outcomes, unsent exclusions, search, reload, neutral All and normal-column restoration after In progress.

## 2026-11-14 — bookmarkable local startup

- Start reuses the running tracker on both platforms; separate Restart files restart it explicitly. A fixed local port (default 8765) is saved per installation, including adoption of older running servers. Concurrent starts are serialized; conflicts fail without random fallback. A different port can be selected with --port or JOBTRACKER_PORT.
- Settings offers opt-in background startup at login through a per-user Windows shortcut or macOS LaunchAgent, independent of agent scheduling and export preferences. Cancel leaves registration unchanged. Updated START_HERE, interface/docs and release file lists/checks; no ZIP rebuilt.
- Isolated Windows checks passed for Start/Restart/Stop, port persistence/conflicts, legacy adoption, origin checks, real temporary shortcut creation/removal and its silent login command. Chrome verified Settings save/Cancel, registration state and desktop/390 px layouts; API and 15 portable regressions passed. Actual OS login and macOS execution remain acceptance checks.

## 2026-11-14 — matching Stop names and build targets

- Renamed the source Stop launchers to `Stop (Windows).cmd` and `Stop (Mac).command`, and updated release build/test references. The four-target `--target` option already existed; README.md now names its accepted values.
- Added short `--target` aliases (`win-x64`, `win-arm64`, `mac-x64`, `mac-arm64`) while retaining the original names and output ZIP filenames. Parser checks passed for all aliases, original names, defaults and invalid input; no distribution rebuild was performed.
- Kept START_HERE.html's explicit Windows and Mac starter names after review, avoiding confusion with the guide's own filename. Script syntax, launcher/reference presence and guide wording checks passed. The distribution ZIPs were not rebuilt, so they still contain the prior Stop names.

## 2026-11-14 — platform release archives

- The default release build now creates Windows x64 and Mac Intel ZIPs, each with one pinned Node runtime, its own Start/Stop files, reduced runtime checksums and a .sha256 sidecar. The old combined ZIP and checksum were removed. ARM64 manifest entries remain available for explicit targets, but no ARM64 package is built by default. Starters on ARM64 report that no package exists yet; emulation was not verified.
- Both ZIPs passed the release audit (`textFiles: 5455`, `workbooks: 1`, `ok: true`) and the release test's checksum, current app files, runtime folder, launcher and Mac permission checks. On Windows x64, the extracted package passed Start/Stop without global Node, repeat launch, empty inventory, self-check and Excel download. The ZIPs are 47,058,433 bytes (Windows) and 52,768,267 bytes (Mac).
- `npm test` passed 57/57 importer cases and 15 portable integration checks after correcting a pre-existing print fixture that incorrectly expected generated status text while setting a manual override. Mac execution and ARM64 emulation were not tested on this Windows x64 computer.

## 2026-11-14 — Reset sorting

- Confirmed and ported ClaudeCodeLocal 8d636ce: Reset restores normal columns before setting Actions descending, so remembered In progress/column sorts cannot override the default. Search clearing, default status exclusions and draft protection remain.
- Synthetic Chrome checks passed for reversed Actions, ascending In progress dates, restored custom columns, cleared filters, Urgent/Shortlisted priority, reload and rejected draft discard.

## 2026-11-14 — compact toolbar actions

- Matched Reset and Columns to Settings at 30 px, retaining 37 px search/preset controls. Chrome verified desktop/narrow sizing, alignment, menu placement and Reset.

## 2026-11-14 — manual application wording

- Ported ClaudeCodeLocal 0b3b974 manual status-text behaviour: exact wording or an intentional blank replaces generated history in the editor and saved-data Excel/PDF exports. Notes preserve it; real stage/date changes regenerate defaults unless explicitly overridden. Date changes preview defaults; drafts and Undo remain supported.
- API/export regressions and synthetic Chrome checks passed for exact/blank text, notes, reload, date/stage changes, manual draft precedence, calendar clear/Cancel and Undo. Existing heading/layout retained; no new JSON fields.

## 2026-11-14 — date-clear controls

- Ported ClaudeCodeLocal 19d042e: accessible clear crosses beside Application, Interview, Offer and Outcome dates. Clears remain drafts until Save; Cancel restores them. Empty and pending-save controls are disabled; native calendars remain.
- Offer date matches one picker-column width, with consistent 10 px gaps above standalone dates. Renamed Your next step to Application steps. Synthetic-data Chrome verified keyboard/focus, 32 px geometry, half-width Offer, draft/Cancel, pending saves, reload persistence and stage visibility.

## 2026-11-14 — column checklist filters

- Inactive checklists start unchecked for one-click selection. Clear removes the selection; All selects every option. Both keep the popup open, and complete/empty selections leave the header neutral. Fresh views and Reset retain New, Shortlisted, Applied, Interview and Offer.
- Existing saved views remain compatible. Model and native Chrome-click checks cover one-click/partial/all/empty selection, popup persistence, presets, text Clear and reload.

## 2026-11-14 — count labels

- All count labels use sentence case. Order remains: Positions collected, Applications in progress, Shortlisted, Urgent, New.

## 2026-11-14 — count box order

- Ordered the count boxes: Positions collected, Applications in progress, Shortlisted, Urgent, New. Chrome verified desktop/narrow visual order and all five filter actions.

## 2026-11-14 — simplified search row

- Removed the Found since toolbar shortcuts and their handlers. The count follows the preset group; Reset and Columns stay together at the right edge. Search uses up to 50% of the toolbar width and takes a full row at window widths of 850 px or less.
- First found column date filtering remains available with the label Found since. Chrome verified responsive sizing and action alignment from 320 to 1800 px, stable widths with search/clear/Reset and presets, date filtering/reload and status autosave, including the Applied shortcut.

## 2026-11-14 — preset spacing

- Added 4 px outer margin per side of the preset group, producing 12 px gaps to neighbouring controls on the same row. Chrome verified desktop gaps, unchanged 37 px height and no page overflow at 390/1280 px.

## 2026-11-13 — consistent outlines

- Shared #cfdacf across neutral control outlines, count box borders/dividers, preset/export dividers, the table frame, header underline and column-filter popup. Internal table lines stay lighter.
- Headless Chrome verified border colours, 1 px table structural edges, unchanged internal separators, popup rendering and desktop/narrow layouts.

## 2026-11-13 — toolbar sizing

- Matched toolbar controls to the 37 px search field, retained text sizes and added side padding to New, All and Reset. Adjusted Columns menu placement.
- Headless Chrome checks passed at desktop and narrow widths for dimensions, padding, overflow and filter actions; rendering inspected.

## 2026-11-13 — rejection after interview

- Rejected position titles are regular, with bold titles and Interview -> Rejected for recorded interview rejections. Links and plain text follow the same rule.
- Added Rejected after Interview to the Status filter as a subgroup of the overall Rejected selection, using existing JSON history fields.
- Model and headless Chrome checks passed for older records, filtering/persistence, All/Reset, live updates and Undo.

## 2026-11-12 — Applied shortcut and count filters

- New and Shortlisted editors have an Applied shortcut using the existing status autosave, date and Undo flow.
- Count boxes trigger the corresponding quick filters with neutral backgrounds. The Urgent count filters flagged positions across all statuses; the toolbar retains four buttons.
- Headless Chrome verified filter parity, persistence, draft preservation, shortcut visibility, Undo, keyboard use and narrow layout. Existing view-model checks passed.

## 2026-11-12 — guide and launcher naming

- Renamed the recipient guide to START_HERE.html and starters to Start (Windows).cmd and Start (Mac).command; updated documentation, release builder and release-test references without rebuilding the ZIP.
- Shortened everyday instructions, removed redundant prerequisites, and directed search changes back to the existing setup chat. Static guide/template/filename checks and release-script syntax checks passed; renamed-launcher execution and updated rendering remain untested.

## 2026-11-11 — recipient guide and search coverage

- Added a Before you start box to START_HERE.html with assistant/app, Gmail, CV and setup-time prerequisites. Removed the separate test-before-scheduling instruction; the guide now follows setup's scheduled-task test order.
- Documented the existing Excel/PDF controls, shared export language and optional report name. Added the agent-owned coverage fields, including dropped-role retention and LinkedIn access results, to SEARCH_WORKFLOW.md.
- Static checks passed for HTML IDs, copy targets, local links, script syntax and source/template parity. Headless Chrome failed to launch (exit -2147483645); visual and scheduled-task acceptance remain pending.

## 2026-11-11 — urgent row markers

- Ported ClaudeCodeLocal JobTracker commit 5b4596a. Urgent positions use the urgency symbol’s red for a 3 px left edge in collapsed and expanded rows, taking precedence over status edge colours.
- Headless Chrome verified New, Interview and Offer, clearing urgency, status dismissal, Undo and the In progress view.

## 2026-11-11 — selecting row text

- Dragging over linked or plain row text preserves selection for copying. Ordinary clicks still expand/collapse rows or open position links, and explicit buttons remain usable.
- Real drag gestures and row/link/action clicks passed in headless Chrome and Firefox. Chrome also verified keyboard expansion after selection.

## 2026-11-11 — In progress layout

- Added Applied on with date filtering. In progress hides Actions, shows Applied on and starts with newest applications first, with unknown dates last.
- Applied on, First found and Posted display dates as D MMM YYYY. Relative posting text is preserved.
- Leaving restores the prior columns and sort. Both layouts survive reload and server restart, including existing filter-only state.
- Targeted model/API checks and headless Chrome/Firefox checks passed for sorting, date edits, view switching, persistence, draft protection and narrow layout.

## 2026-11-10 — column filter shortcuts

- Added a one-click × with a 25 px hit area, keyboard focus return and saved filter state.
- Made active highlights square and continuous. Aligned left-aligned headings with row cells and the clear glyph with capital letters.
- Capped Fit at 80 px, Actions at 114 px and Country at 124 px. Fit uses the shared 12 px left inset. Centered plus/minus controls in a 44 px column. Country pairs wrap, and text columns receive extra width.
- Headless Chrome and Firefox verified controls, sizing, alignment, resizing, hidden columns and draft preservation.

## 2026-11-10 — dismissal

- Dismissing an urgent position clears its urgency in the same save. Undo restores both values. API and headless Chrome checks passed. Pushed [5464936](https://github.com/b-mishas/ApplicationTracker/commit/546493687d5a83a47688be5d916d049dd5219490).

## 2026-11-07 — Undo

- Added one-step Undo for saved position edits and quick actions, using the existing revision and backup checks. Added a curved-arrow icon and one-second grey text feedback beside Undo with stable header geometry. Source and headless Chrome tests passed. Pushed [132ff2a](https://github.com/b-mishas/ApplicationTracker/commit/132ff2a112cda94a76d5812460ee3d4e3913ddbe).

## 2026-11-07 — overview and filters

- Added the New count after Shortlisted. Headless Chrome verified that it updates when shortlisting and counts across table filters.
- Added the Applied preset for Applied, Interview and Offer, with a narrower search field when needed. Chrome verified filter persistence and responsive layout. Pushed both UI changes in [0c38cb9](https://github.com/b-mishas/ApplicationTracker/commit/0c38cb939440d0efd3315a19be93ad174b510db0).
- Removed the Active button and renamed Applied to In progress. The default and Reset views retain the original five-status selection. Pushed [a39b7ea](https://github.com/b-mishas/ApplicationTracker/commit/a39b7ea2f48fafde5638b3298d74063fc353cbb5).

## 2026-11-06 — Windows rehearsal follow-up

- Aligned settings and workbook JSON input with the importer’s UTF-8 BOM support. Documented how to set and verify the import timezone in PowerShell when Git Bash drops it. Source tests passed, including 15 portable integration checks.
- Verified the release builder’s runtime stage in Git Bash with all four runtime archives and a locked Windows executable. The builder uses Windows tar and preserves a running checkout executable while selecting the pinned runtime for the archive. Windows follow-up committed in [85be9ae](https://github.com/b-mishas/ApplicationTracker/commit/85be9ae48f698f221965731c4430ab0e5665396e).

## 2026-11-05 to 2026-11-06 — tracker workflow and exports

- Made groups and countries record-driven and dates local. Bundled country flags with UK mapped to GB. Kept automatic Fit and Group colours, with stable group assignments and an Oklab palette tested for the first eight colours. Added five ignored development positions.
- Added immediate status and outcome saving with draft preservation, separate interview/offer milestones, and dated export history. Added the New, Shortlisted, Active and All presets, persistent filters and the Urgent count. Applied uses gold-brown text, Interview uses green text and edge, Offer uses a green fill, gold accent and dollar badge, and Rejected uses grey text. Row edges share a 3 px width.
- Made Windows Start restart only its own tracker installation. Fixed Firefox's filter calendar jitter during status saves.
- Grouped Excel and PDF exports. Both share saved rows, localized titles and an optional name. PDF uses A4 landscape with repeating headers. Moved Settings to the far right and added the JSON export tooltip.
- Pushed tracker commit [`82dc7d3`](https://github.com/b-mishas/ApplicationTracker/commit/82dc7d3bb88c0b62da02609e4753c6c42bd6d0c4) to `main`. Source checks passed 57 importer cases, view-model, palette and API checks, and 14 portable integration checks. Headless Chrome verified the editor and exports, including a six-page landscape PDF. Headless Firefox verified calendar stability.

## 2026-11-05 — portable package and onboarding

- Renamed the local and GitHub repositories to ApplicationTracker and kept the `JOBTRACKER_*` environment variables. Added bundled Windows/macOS runtimes, launchers, self-check, ExcelJS export and employer workbook tools, and a pristine-template ZIP builder and audit (`45f07a3`).
- Verified an earlier ZIP on Windows x64 from a clean extraction without global Node. Start and repeat launch, empty inventory, self-check, Excel download, Stop and privacy audit passed. Verified all four runtime hashes and macOS executable permissions.
- Committed agent setup, routine, templates and adjustable fit guidance (`a030d28`, `1fb3caa`, `4e13896`). Consolidated onboarding into `START_HERE.html` and added four copyable chatbot prompts.

## 2026-11-04 — standalone tracker

- Created the separate JobTracker repository (`0f7ad2b`) with pristine agent, guide and profile templates. Used installation-relative data and initialization that preserves an existing inventory. Verified importer, view model, API saves and repeat initialization on Windows.
