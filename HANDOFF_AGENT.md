# Agent handoff

Updated 2026-11-17 23:31:20 UTC (2026-11-18 Berlin), Codex; migrated from the 23:19:39 UTC review snapshot. Objective: review Claude's routine-cost proposal and prepare instructions; no prompt/script implementation this turn.

Checkout: C:/Users/misha/Claude/ApplicationTracker; migration commit prepared on main from HEAD 4581dab, upstream origin/main (five commits ahead before this commit); return to design/sidebar after advancing it to include the migration. The design branch has no upstream; remote/CI unverified. Existing changes in HISTORY, PLAN, INTERFACE_FOR_TRACKER, app/SEARCH_WORKFLOW, app UI/model/schema/tests and untracked design/ were preserved. Prior verification is in HISTORY; not rerun here.

## Agent work: next action (currently Claude)

Follow local untracked ROUTINE_COST_REVIEW.md for the precise implementation and acceptance specification (preserved but excluded from the migration commit). Change the routine and pristine profile with their templates, synchronizing both interface documents. Do not change app code, live data/schedules, filled profiles, original JobTracker or ZIPs; no subsequent implementation commit or push authorized.

Adopt economical seven-item completion, fuller batches, ten posting reads per worker, verified employer method caching and five career-URL discoveries per run. Distinguish policy deferral/partial coverage from tool failure everywhere, including unfinished; never advance successful dates after partial work. Use smallest-model employer readers for proven simple cached methods initially; retain the middle model for unfamiliar/complex sites pending comparative rehearsal. Preserve scope exceptions and main-agent fit rating.

Use 3/7/14-day employer defaults with 20 attempts, preserve explicit profile overrides, order by next-due date and prevent blocked sources monopolizing the queue. Weekly gap searches must catch up after missed days. Refreshes record successes only, avoid same-day duplicates and retain the unresolved-record retry stop. Update the exact coverage JSON example and backward-compatible semantics. The local review defines thresholds, counters and edge cases.

Verification: read current owning prompts/contracts and inspected JobTracker commit 15dbda5, current handoff and board script. That handoff reports 24 PC board tests, but no measured optimized end-to-end run. Script inspection found premature seen-ID advancement and pagination-limit risks; defer porting pending the review's recovery/filter requirements. Initial sandbox Git access to JobTracker failed; elevated read-only inspection succeeded. No runtime tests, platform acceptance or live search performed.

Migration: split handoffs by function and aligned both assistants' rules. API extraction/board scripts belong here even when Codex implements them; packaging/importer integration belongs in [HANDOFF_WRAPPER.md](HANDOFF_WRAPPER.md). The review and implementation instructions above are preserved; no prompt/script implementation occurred. Migration link/rule and release-exclusion checks passed; details are in HISTORY.md. No operations started/stopped; existing app processes not inspected. Next: Claude implementation, static scenario checks, then separately identified live/model rehearsal.
