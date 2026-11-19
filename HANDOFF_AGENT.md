# Agent handoff

Updated 2026-11-19 19:59 UTC, Codex. Scope: commit rehearsal-driven routine/setup corrections with Claude's amendments. Checkout C:/Users/misha/Claude/ApplicationTracker, main; pre-commit HEAD c2ccc64, tracking origin/main (one local wrapper commit ahead before this commit). Remote/CI unverified. This snapshot accompanies the requested [Prompt] commit. No push or distribution build. Preserve unrelated HANDOFF_WRAPPER.md, untracked design/ and the working-copy deletion of HISTORY.md's Applied preset ordering entry; that deletion is excluded from this commit.

## Implemented agent changes

Codex (from the Terra rehearsal 2026-11-18 and follow-up 2026-11-19):
- Search recovery: actually attempt an available browser for blocked, JavaScript-shell or unfollowable paginated listings within the fifteen-call/five-minute source limit; record real errors or limits; an unconfirmed empty page is incomplete; a LinkedIn failure says nothing about employer sites.
- Auditability: `run-completion.json`, ledger with an outcome and reason per candidate, `source-evidence.jsonl`; counters reconciled with ledger and importer report.
- ROOT-only access: unique `data/reports/runs/<run-id>/` per run (ID = batch runId); setup validation in a `setupcheck-` folder there; documented in INTERFACE_FOR_TRACKER.md.
- No nested delegation, one capability test, no short status polls; setup acceptance by evidence, not run length.

Claude on top:
- Model rule: never a subagent on a model larger than the lead; smallest unavailable → middle; no model choice → subagent without a model setting (replaces "lead reads directly", which grows the lead's context).
- Small sets (up to three sources or five postings of a kind) are read directly; rehearsal and employer-only clauses removed from Part B and setup.
- Source evidence one line per source; run folders older than 30 days deleted (added to permitted writes); Coverage and setup acceptance text shortened.
- Codex automation on Terra (setup step 10, guides/SETUP_CODEX.md); both setup guides drop the half-hour expectation.
- PLAN: regression cases for the two missed openings (Zalando page 2, n8n JavaScript board); regenerate installed prompts.

Files: agent/ROUTINE_PROMPT.md, agent/SETUP_PROMPT.md, guides/SETUP_CLAUDE.md, guides/SETUP_CODEX.md (+ identical templates/ copies), INTERFACE_FOR_TRACKER.md, PLAN.md, HISTORY.md.

## Verification

Commit checks: all four changed prompt/guide source files match their templates; staged whitespace and scope checked. Claude previously reported npm test exit 0 and full agent/guide/profile parity; no full-suite rerun for this documentation-only commit. Rehearsal evidence: .build-cache/terra-rehearsal-20261118-1416/evaluation/REPORT.md and .build-cache/terra-followup-20261119/evidence/REPORT.md (Claude read reports, not underlying logs). These prompt revisions have static verification only.

Untested: agent adherence to the browser fallback and model rule, failed refresh, unattended scheduling and ROOT-only permissions, Gmail, authenticated LinkedIn, packaged platforms. Installed filled prompts, automations, the manual rehearsal-daily-job-search task and ZIPs hold older Part B text.

## Next

Regenerate installed prompts through agent/CUSTOMIZE.md and run a narrow rehearsal checking the two regression cases when authorized. Neither was performed for this commit. No active searches or background operations started.
