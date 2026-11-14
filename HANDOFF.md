# Application tracker checkpoint

Updated 2026-11-14 21:02 UTC by Codex. Isolated checkout C:/Users/misha/.codex/worktrees/new-count-boxes/ApplicationTracker, branch feature/new-count-boxes, no upstream. HEAD is the grouped-counters commit containing this snapshot (parent f7918be). Remote/CI unverified. No operations active. No push, merge or ZIP rebuild performed. Main advanced to 0079cf2 during this work; this branch remains based on 9735f09 and does not include that later port-settings commit.

## Three requested ports

User requested ClaudeCodeLocal JobTracker commits edc13d6, 19a25bd and 1299faf as separate commits. Created this managed worktree from main at 9735f09, preserving the parent's then-uncommitted feature/port-settings checkout without switching or importing its changes. Original JobTracker code and personal data were read-only sources.

1. ada39b5 ports edc13d6: sent-application totals derive from existing dates, effective stages and current/legacy interview/application history. The clickable counter includes later outcomes; Status distinguishes Applied (pending)/(total).
2. f7918be ports 19a25bd: Interviews held totals include recorded interviews across later outcomes and legacy history. Status distinguishes Interview (pending)/(total); the other new counter reads Applications sent.
3. This commit ports 1299faf: the application overview contains Positions collected, Applications sent, Interviews held and Applications in progress; a separate priorities group contains Shortlisted, Urgent and New. A parent click handler serves both groups. Groups wrap with a 12 px gap; neutral count styling and the four toolbar presets remain.

## Verification and next action

Model regressions passed for both totals, unsent/missing-date/legacy cases, pending-only filtering, All/default selections and other filters. Synthetic Chrome checked totals/outcomes, search, reload persistence, pending/total choices, All/Reset, live autosave/Undo counters, all seven group clicks and responsive wrapping without page overflow at 390/900/1280/1800 px. Desktop/narrow screenshots were visually inspected. app/check.mjs passed save/revision/origin, Undo and export regressions. Syntax/whitespace checks passed.

Only app UI/model/test files and HISTORY/HANDOFF changed. No schema, importer, export or agent contract changed. Tests used temporary fixtures/profiles; an ignored junction reuses installed node_modules read-only. Physical-device/macOS and release acceptance remain untested. Next: review these three commits; merge/push or build ZIPs only when requested. Keep this worktree attached for review.
