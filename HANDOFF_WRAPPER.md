# Wrapper handoff

Updated 2026-11-20T20:40:51.787Z (Codex). Scope: statistics default sorting, followed by preset-aware Reset as a separate commit. Checkout C:/Users/misha/Claude/ApplicationTracker, main; parent 232d5ed, upstream origin/main with eight existing local commits before this task. User authorized two commits; no push requested. Remote/CI unverified.

Statistics views All positions, Applications sent, Interview invites and Offers received now default to descending applicationDate. Existing missing-date-last, Fit tie-breaking and Dismissed-last rules remain. Layout-default version 3 upgrades saved Statistics layouts still using star descending once; other custom sorts, column visibility/order and widths remain. Applied retains its Offer/Interview/Applied grouping.

Verification: focused column-layout and view-model suites passed, including default sorting, one-time upgrade and preserving custom sorts. Isolated Chromium selected all Statistics presets and verified date sorting. Temporary fixture server/browser stopped; no real inventory or settings edited. Other browsers and physical platforms untested. Next: implement and verify Reset restoring the selected preset, then make the second commit. No distribution build or active operation.

Prior orchestration integration remains unchanged: run-state uses the existing importer for recovery, and summary reporting is read-only. Consult app/RUN_STATE.md, HANDOFF_AGENT.md and agent/orchestration/ORCHESTRATION_HISTORY.md for its verification and limitations. Preserve the unrelated HANDOFF_AGENT.md change and untracked design/. Normal backend was last reported at http://127.0.0.1:56068; this task did not restart it.
