# Wrapper handoff

## Posting-date and settings port — 2026-11-25T12:04:43Z (Codex)

Ported JobTracker `1078034` and `3e38f5a` on main, starting at ee59cd6; remote/CI unverified. Agent instructions committed as bfbd0a9; this second requested commit records wrapper implementation and shared contract documentation. Preserve unrelated PLAN.md, ROADMAP.md, APPLICATIONTRACKER_FIXES.md and design/ changes.

app/app.js, index.html and style.css now show Settings saved as a fixed overlay: click dismissal, two-second expiry, no table movement; Save precedes Cancel. Name/language and port/startup controls are retained. Posted cells show Unknown for empty/legacy invalid wording.

app/batch.schema.json and jsonschema.mjs require postedDate to be a valid YYYY-MM-DD or empty, rejecting invalid records individually. app/migrate-posted-dates.mjs previews legacy conversions by default; explicit revision-checked apply retains original wording in a report and uses shared locking, backups and atomic replacement. Matching source observations anchor relative dates; ambiguous wording clears. It reuses calendarDate/process timezone rather than hard-coded Berlin. No real inventory migration performed.

Agent routine/template, INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md agree on observedAt, Part A timezone and source evidence. Future release whitelist includes the migration helper; npm test includes regressions. No ZIP was rebuilt. See HISTORY.md and the focused HANDOFF_AGENT.md update.

Full npm test passed, including 60 importer cases, migration evidence/backup/stale revision/idempotence, non-Berlin timezone and template drift. Isolated headless Chromium with synthetic data verified save, fixed positioning/no layout shift, click dismissal, two-second expiry and Unknown date display. Browser/server stopped. Other browsers, actual macOS login and recipient acceptance untested. Existing packages and earlier limitations below remain applicable.

Next: user review; regenerate existing installation prompts before stricter imports. User requested two local commits; no push requested and no active operation.

Updated 2026-11-24T16:30Z (Claude): storage lock fix from JobTracker committed and pushed as 1c42e6f [Wrapper]: app/store.mjs withLock retries only open(lock, 'wx'); Windows EPERM there (a released lock still being deleted) waits like a held lock and is rethrown after the whole timeout; a failure while writing the owner token frees the lock and fails at once (test seam openLock, app/test-store-lock.mjs in npm test; import-test cleanup retries). npm test passes; the 1-in-40 race not re-measured; Mac untested. dist/Application-tracker-windows-x64.zip rebuilt from 8663380 (audit ok); Mac archives from 330274f; nothing published. Awaiting Codex review with the agent commits listed in HANDOFF_AGENT.md.

Updated 2026-11-20T20:51:35.121Z (Codex): ported JobTracker bcad8b4, b8999dd and 5d16323 into app/app.js, app/style.css and app/column-layout.mjs. Removed expansion column; rows expand with mouse or keyboard. Fit cells are centered in commit 2b32a76. Urgent now counts/filters New and Shortlisted, including on Reset; zero New count is grey. Compact columns keep fixed base widths and selected unfiltered headings do not wrap. Model/layout tests and isolated Chromium checks for row expansion, spans and Urgent Reset passed; other browsers and visual review pending. The three feature commits were requested; no push or distribution build. Preserve unrelated HANDOFF_AGENT.md and design/. Earlier rapid combined preference-save mismatch remains unresolved. Next: user review. Remote/CI unverified; temporary fixture server/browser stopped.

Updated 2026-11-20T20:40:51.787Z (Codex). Scope: statistics default sorting, and preset-aware Reset in two separate commits. Checkout C:/Users/misha/Claude/ApplicationTracker, main; Reset commit parent d6dd1b8, upstream origin/main with eight existing local commits before this task. User authorized two commits; no push requested. Remote/CI unverified.

Statistics views All positions, Applications sent, Interview invites and Offers received now default to descending applicationDate. Existing missing-date-last, Fit tie-breaking and Dismissed-last rules remain. Layout-default version 3 upgrades saved Statistics layouts still using star descending once; other custom sorts, column visibility/order and widths remain. Applied retains its Offer/Interview/Applied grouping.

Verification: focused column-layout and view-model suites passed, including default sorting, one-time upgrade and preserving custom sorts. Isolated Chromium selected all Statistics presets and verified date sorting. Temporary fixture server/browser stopped; no real inventory or settings edited. Other browsers and physical platforms untested. Statistics sorting committed as d6dd1b8. Reset now restores the current preset’s filters, clears search/extra filters and restores default columns/order/widths/sort. Urgent retains its urgency filter; unmatched custom status combinations fall back to All. Independent Chromium sessions verified all eight presets, reload persistence and preserving other saved layouts. A rapid combined single-page test encountered a preference-persistence mismatch; its cause is unconfirmed and is a follow-up limitation. Normal independent interaction checks passed. User review remains next. No distribution build or active operation.

Use logs (Claude, 2026-11-23, uncommitted): app/diagnostics.mjs added to the build-release app list and its test to the package.json test script; START_HERE.html gains a "Problem report" copy block. dist/ not rebuilt.

Release (Claude, 2026-11-23): dist/ rebuilt from 330274f; build audit with private markers and scripts/test-release.mjs passed on Windows. Mac archives untested on a Mac; nothing published.

Template drift test (Claude, 2026-11-23): app/test-templates.mjs, added to the package.json test script, fails when agent/, guides/ or profile/ differ from templates/ (agent/orchestration and Git-ignored private files skipped). Not shipped in releases.

Orchestration (agent side, 2026-11-22): run-state.mjs and candidate-ledger.mjs were retired for the read-only app/capture-check.mjs; package.json test and scripts/build-release.mjs file list were updated accordingly. Consult HANDOFF_AGENT.md and agent/orchestration/ORCHESTRATION_HISTORY.md for its verification and limitations. Preserve the unrelated HANDOFF_AGENT.md change and untracked design/. Normal backend was last reported at http://127.0.0.1:56068; this task did not restart it.


## Codex review — 2026-11-24T16:29:16.433Z

Reviewed 1c42e6f storage lock and diagnostics integration through 2bb2f48. main at 2bb2f48, one ahead of local origin/main; remote/CI unverified. No new confirmed blocker in withLock: retries are limited to acquisition; token-write failure closes/releases and fails; normal release verifies ownership. test-store-lock passed, including deletion-forbidden rename fallback and subsequent acquisition. Actual intermittent Windows race frequency not re-measured; Mac untested.

Diagnostics has a reproduced P2: masking space-containing Windows paths leaves surname/path fragments. Existing diagnostics tests pass but omit this case. See appended HANDOFF_AGENT review for fixes and verification. Next: focused export/masking regression before relying on privacy claims. No source/UI/inventory/settings, packaging, commit/push or automation changes. Prior content preserved; no active operations started.


## Codex follow-up review — 2026-11-24T17:11:40.704Z

Diagnostics masking fix reviewed: space-containing Windows paths, quoted paths, UNC and selected Unix roots now covered by regressions; test-diagnostics passes. User-facing wording correctly warns that free-form errors may retain personal/employer names. This resolves the reported partial-path reproduction, not universal anonymization. Other focused suites and diff check passed; no full-suite/OS/release acceptance rerun. Remaining prompt/finish-run findings appended to HANDOFF_AGENT. No wrapper code, data or package changes made in this review.
