# Application tracker checkpoint

Updated 2026-11-14 20:57 UTC by Codex. Isolated checkout C:/Users/misha/.codex/worktrees/new-count-boxes/ApplicationTracker, branch feature/new-count-boxes, no upstream. This snapshot accompanies the first feature commit (parent 9735f09). Remote/CI unverified; no push or ZIP rebuild. No operations active.

## Scope and first port

User requested JobTracker features from ClaudeCodeLocal edc13d6, 19a25bd and 1299faf as three separate commits. Created this managed worktree from main to avoid disturbing the parent's uncommitted feature/port-settings checkout. No source tracker code/data or parent working files were modified. Tests reuse installed node_modules through a local ignored junction; fixtures and browser profiles live in temporary directories.

Ported edc13d6: hasSentApplication derives sent-application membership from dates, effective stage, interview evidence and status history. A clickable total counter includes rejected/withdrawn and legacy records. Status choices distinguish Applied (pending) and Applied (total). Existing search/column filters, empty-selection defaults, all-status handling and saved views remain compatible. No data schema, importer or export changes.

## Verification and next action

app/test-view-model.mjs passed the copied source regressions plus destination empty-selection cases. Synthetic Chrome verified counts, outcome inclusion, unsent exclusion, search, reload persistence, All/pending labels and column restoration after leaving In progress. Source syntax and whitespace checks passed. No real records were touched. Physical-device, macOS and release acceptance were not attempted.

Next: port 19a25bd interview totals in a second commit, then 1299faf grouped counters in a third commit. Preserve this isolated branch for review; do not merge, push, switch the parent checkout or rebuild dist without a request.
