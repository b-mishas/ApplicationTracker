# Application tracker checkpoint

Updated 2026-11-14 20:59 UTC by Codex. Isolated checkout C:/Users/misha/.codex/worktrees/new-count-boxes/ApplicationTracker, branch feature/new-count-boxes, no upstream. This snapshot accompanies the second feature commit (parent ada39b5). Remote/CI unverified. No push, merge or ZIP rebuild performed; no active operations.

## Completed feature ports

User requested JobTracker commits edc13d6, 19a25bd and 1299faf as separate commits. The first port is ada39b5, Add total applications counter and filter: sent-application membership includes dated/current/historical applications and later outcomes. The counter is clickable; Status distinguishes pending from total applications.

This second commit ports 19a25bd. Interviews held counts records with interview evidence, including legacy history and later rejection/offer/withdrawal. Status choices distinguish Interview (pending) from Interview (total), while the first counter now reads Applications sent. Filtering uses the existing status filter and saved-view contract; no position fields/schema, importer or export changes.

## Verification and next action

app/test-view-model.mjs passed original destination cases and source regressions for both totals, missing dates, legacy history, outcomes, All/default selections and other column filters. Synthetic Chrome verified interview counts/outcomes, search, reload persistence, pending/total checkbox selection, All/Reset and both live totals after status autosave/Undo. The prior applications-total browser check also passed. Syntax/whitespace checks passed. Fixtures, browser profiles and records are temporary; the original tracker/data and parent's port-settings working files remain untouched. An ignored dependency junction reuses installed modules without changing them.

Next: port 1299faf into the third commit, separating application-overview counters from position-priority counters and verifying both groups' delegated clicks and responsive layout. Preserve this worktree for review. Physical-device/macOS and release acceptance remain untested; do not push, merge, switch the parent checkout or rebuild distributions without a request.
