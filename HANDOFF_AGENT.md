# Agent handoff

Updated 2026-11-23, Claude. Scope: routine prompt cleanup after Claude's audit and Codex's review of it. main at ad0e2f5 (the changes below plus ROADMAP.md), eleven commits ahead of origin/main (not pushed); remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Uncommitted (Claude, after the first real run)

- Routine and template, line 76: `text` partial now means the description itself stops early (cut tool output must be read further first); rereads get `reread: true` in the ledger. Evidence: JobTracker run run-202611231816-e3ef, 20 of 30 extracts partial from tool truncation, none reread. Findings reported in `C:/Users/misha/Claude/Code/JobTracker/BUGS.md`.

$1

- `agent/ROUTINE_PROMPT.md` = `templates/agent/ROUTINE_PROMPT.md` (Part B; drift test passes):
  - Stops reading app/SEARCH_WORKFLOW.md. Its routine-relevant details now sit in Part B: bundled Node paths (§1), workbook `read`/`update` commands (§1, §5) and the PowerShell TZ caveat (§9).
  - One resume-or-create run start; the run ID is read back from run-completion.json.
  - Work order in §2 (alerts collected → refreshes → alert postings → employers → portals → gap searches → re-checks); the checklist is acceptance only.
  - One link-finder procedure (§5, step 0). Title only rules sit in §6 only.
  - `subagents` {kind, model, file} in run-completion.json, added at start; the summary and run-log.json take counts and models from there.
  - Duplicates and leftovers cut. Word count went from 7,363 to 7,174; the main saving is the 2,420-word read.
- `INTERFACE_FOR_TRACKER.md`: the routine no longer reads SEARCH_WORKFLOW; Part B carries the import, TZ, Node and workbook commands; there are no deadline fields.
- HISTORY.md entry; PLAN item 9 (closure).

## Judgements on Codex's review

- All agreed cuts done. The employer reconciliation safeguard, the check-before-read rule and the subagent instructions are kept.
- Closure unchanged: a banner-only posting stays Unverified and is flagged. §1 now defers to §6. The importer change is PLAN item 9.
- Kept the fallback "subagent without a model setting runs on your own model". A fresh same-model subagent costs no more per token than the lead, and it keeps the lead's context small. Doing the work in the lead re-reads that context on every turn.

## Verification

- `npm test` exit 0.
- `git diff --check` clean.
- Prompt edits checked by rereading only; no agent run.

## Next action

- Codex's implementation review of 651acad (URL aliases) and f545cb8 (diagnostics) is still pending.
- Rebuild dist/ (still built from 330274f) and fix the rehearsal task's ROOT before the next rehearsal.
- JobTracker has its own copy of the same audit; not ported.

No active operations.
