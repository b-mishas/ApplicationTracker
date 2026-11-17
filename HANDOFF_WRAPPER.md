# Wrapper handoff

Updated 2026-11-17 23:31:20 UTC (2026-11-18 Berlin), Codex. Objective: migrate the shared checkpoint to separate function-based handoffs while preserving unfinished wrapper work.

Checkout: C:/Users/misha/Claude/ApplicationTracker; migration commit prepared on main from HEAD 4581dab, upstream origin/main (five commits ahead before this commit). Return to design/sidebar after advancing it to include the migration; that branch has no upstream. Only migration changes are selected for commit; remote/CI unverified. Existing app UI/model/schema/tests, app/SEARCH_WORKFLOW.md, PLAN.md, HISTORY.md, INTERFACE_FOR_TRACKER.md and untracked design/ remain unfinished work; no app implementation was changed in this migration.

Current wrapper context: Uncommitted HISTORY.md additions record the sidebar/navigation and application-shortcut work, date-based interview statistics and the subsequent correction making Offers depend on current effective status. Current view-model code calls interviewDetails and hasCurrentOffer. Earlier model/API and browser checks are recorded in those local HISTORY.md additions; they were not rerun here. PLAN.md still contains an interview-correction item whose wording predates those history entries: reconcile it against code before treating it as pending implementation.

Migration changes: AGENTS.md and CLAUDE.md now select and maintain handoffs by function, independently of assistant identity. README, PLAN, HISTORY, PORTABILITY, INTERFACE_FOR_TRACKER and ROUTINE_COST_REVIEW references were updated. Release builder/audit/test guards now reject both new handoff names as well as the legacy name. Unrelated review/history/plan and app changes stay uncommitted. The old shared handoff was replaced; its latest agent review is preserved in HANDOFF_AGENT.md.

Verification: targeted documentation/reference, JavaScript syntax and synthetic in-memory archive exclusion checks; see the migration HISTORY entry for results. No release build, app runtime test, live search or platform acceptance performed. Existing ZIPs were not changed.

Next: continue the requested wrapper work after inspecting its diff; consult PLAN.md for remaining acceptance work. API extraction and board-script work belongs in HANDOFF_AGENT.md; record only any resulting importer or packaging implementation here. Only the handoff migration commit is authorized; no push requested. No operations started/stopped; existing app processes were not inspected.
