# Application tracker checkpoint

Updated 2026-11-14 21:21 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker, branch main, tracking origin/main. This snapshot accompanies the requested merge of feature/new-count-boxes (0dc955f) into main (0079cf2); HEAD is this merge commit. Remote/CI unverified. No push or ZIP rebuild performed. Remove the managed counter worktree only after successful verification/merge.

## Integrated features

The branch retains three separate ports: ada39b5 from ClaudeCodeLocal edc13d6 adds total sent applications; f7918be from 19a25bd adds total recorded interviews; 0dc955f from 1299faf groups the counters. Applications sent and Interviews held include later outcomes and legacy history, while Status offers separate pending/total choices. The application group contains Positions collected, Applications sent, Interviews held and Applications in progress; priorities contain Shortlisted, Urgent and New. Both groups use shared click delegation, neutral styling and responsive wrapping. The four toolbar presets remain unchanged.

Main's Advanced port settings, conflict-safe launchers, editable field/stale-server guidance and top-anchored Settings dialog remain integrated. No inventory/schema, export preferences, importer or agent contract changed. Original JobTracker code/data were read-only sources.

## Verification and local preservation

Feature model/browser/API tests passed before merging, including history/outcomes, search/reload, All/Reset, autosave/Undo, seven click actions and 390/900/1280/1800 px rendering. Merge conflicts were limited to HANDOFF/HISTORY; application files merged automatically. Merged-tree model and port-settings regressions passed. Chrome verified all seven counter actions and responsive wrapping, plus the editable local port, correct current address and stable Settings top edge. Physical-device/macOS, actual OS login and release acceptance remain untested.

Before merging, main had uncommitted handoff notes and design/wrapper-directions.html. Exact notes and design hashes were saved under .build-cache/count-merge-preservation.json and its referenced backup. Keep design files unchanged and restore the local design-review notes after the merge commit, without folding that unrelated work into it. The design review remains pending; no proposed wrapper design was applied.

Next: finish the merge commit, restore local notes and remove the isolated worktree through the app. Keep ZIPs unchanged unless explicitly requested.
