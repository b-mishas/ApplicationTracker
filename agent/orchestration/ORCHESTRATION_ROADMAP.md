# State-driven search orchestration

**Goal:** find relevant vacancies, assess them and store them reliably with economical context use.

## How to use this roadmap

Consult before changing search sequencing, capture, checkpoints, recovery, retention or reporting. **Check code before assuming implementation.** Amend the roadmap only when the **overall plan changes** (scope, priorities, sequencing or design direction); do not expand it for routine progress. Put details, decisions and verification in [ORCHESTRATION_HISTORY.md](ORCHESTRATION_HISTORY.md), current checkout state in [HANDOFF_AGENT.md](../../HANDOFF_AGENT.md). Keep brief accomplishments in [root HISTORY.md](../../HISTORY.md) and only a pointer in [PLAN.md](../../PLAN.md). This is maintainer guidance, not scheduled-run context or a pristine template.

The [routine](../ROUTINE_PROMPT.md), [workflow](../../app/SEARCH_WORKFLOW.md), [interface](../../INTERFACE_FOR_TRACKER.md) and [batch schema](../../app/batch.schema.json) remain the runtime contracts. Update affected prompts and pristine copies together.

## State and responsibilities

| Artifact | Purpose |
|---|---|
| run-completion.json | **Identify the run.** Records its id, start time and profile hash. Unfinished source work is carried in coverage.json `unfinished`, not in a separate task list. |
| run-ledger.jsonl | **Keep track of every discovered job vacancy.** Preserves its identity, sources, assessment and current disposition so unfinished work is not lost. |
| source-evidence.jsonl | **Show what was actually checked.** Records search methods, pages/items inspected, coverage evidence, failures and where to continue. |
| coverage.json | **Decide what to check next time.** Remembers successful source checks, reusable access methods, dropped vacancies and refresh/recheck history across runs. |
| Inventory and importer reports | **Show what was stored.** jobs.json source files tell which run added or touched a record, regardless of retries; importer reports give counts and records to repair. |

The agent calls one helper, `run-state.mjs` (init, capture, resolve, summary), which stores finds through `candidate-ledger.mjs`; the agent judges relevance and evidence. **Only the existing importer writes inventory.** Contracts: [CANDIDATE_STATE.md](../../app/CANDIDATE_STATE.md), [RUN_STATE.md](../../app/RUN_STATE.md).

**Terminology:** a job vacancy is a discovered role; the candidate is the human job seeker. Existing code/file identifiers containing `candidate` remain unchanged for compatibility.

**Where details live:** ledger fields and assessment rules are in CANDIDATE_STATE.md; commands and their output groups are in RUN_STATE.md. Source-evidence and coverage procedures are in ROUTINE_PROMPT.md. Verify exact validation against the helpers and batch schema. The history explains decisions and test evidence; it is not the field contract.

## Invariants

- **Capture immediately**, including setup discoveries, before selecting postings to investigate. Every captured job vacancy has a disposition or remains discoverable as pending.
- **Check finds at capture.** A find sharing a provider ID or posting URL with any inventory record or dropped entry is saved as a duplicate before anyone reads or rates it; name-only matches are left to the agent.
- **Keep bookkeeping cheap.** Every helper call costs a lead turn that re-reads the whole context. Prefer one call per batch of finds and one per batch of decisions; put command lines in the routine so the agent need not read the contracts.
- **Assessment is not delivery.** Preserve reusable results and distinguish prepared batches from confirmed imports. Deduplicate conservatively; retain distinct vacancies and source occurrences.
- Save after discovery/result batches, assessments, source attempts and imports, and before blocking calls—not after every tool call. On restart, inspect saved pending work before repeating external work.
- Respect current scope and profile revisions. Temporary exclusions never become permanent preferences. Resume mutable listings with overlap and deduplication.
- **Source coverage needs evidence.** Partial listings never earn successful check dates; cached methods and task labels do not prove coverage.
- Derive delivery and "added this run" from the inventory, not from per-attempt receipts. The importer is idempotent, so an interrupted import is simply rerun; its report describes the latest attempt only.
- Preserve unresolved work and all dependencies. Current policy retains all runs; destructive pruning remains deferred. No automatic legacy migration.
- Derive counts from saved state and evidence. Identify uncertainty and differing count scopes explicitly; never invent missing metrics or coverage.
- Use one lead writer and atomic updates; a lock serializes writers, so callers need not pass revisions. State cannot interrupt blocked tools or recover discoveries the agent never captured.

Avoid self-reported call budgets, mid-run stop/resume protocols, a database/framework, transcript archives, **serialized conversation state**, copied page dumps, duplicate manual counters and per-call narrative diaries. Keep compact evidence sufficient for decisions and recovery.

## Milestones and acceptance

- [x] **1. Capture:** durable job-vacancy ingestion and reusable assessments across setup/routine boundaries. Seven captured, three assessed, four pending survive fresh-process recovery.
- [x] **2. Recovery:** profile staleness, pending queries, saved cursors and safe retention (receipt-based import recovery was later replaced by inventory-derived delivery, see milestone 5). Required interruption checks cover extraction, assessment, batch creation, inventory commit, report write and archival, including partial/ambiguous imports, missing/overwritten reports and preserved user fields. See history for which checks are implemented and their limits.
- [x] **3. Reporting:** generated job-vacancy/task/import totals and aligned prompts. Counts reconcile or expose uncertainty; no unsupported source-coverage claims. Details and limitations are in the history.
- [x] **4. Live measurement (narrow evaluation concluded, limitations recorded):** compare equivalent continuous and interrupted agent runs for retained job vacancies, outcomes, repeated external reads and native token use. Report excluded capabilities and unavailable measurements. A narrow check is not full setup, browser or platform acceptance.

Use isolated rehearsal inventories and fictional profiles, **never real application records**. Include stale profiles, run-only exclusions, changed pagination, a 31-day-old unresolved job vacancy and its referenced payload and user-owned fields in relevant tests. Measure token savings before claiming them.

- [x] **5. Simplification:** keep capture, cross-run `next` and the derived summary; drop revision checks, call budgets, stop/context/resume and the import receipt layer; derive delivery from jobs.json. Fixture-tested; no agent run yet.
- [x] **6. Small-model acceptance:** a multi-posting rehearsal on the routine's intended models (smallest/middle subagents) with and without the state helpers, comparing retained vacancies, summary accuracy and native token use. **Result (2026-11-20, one run per arm):** equal retention, no trap reads and exact counts in both arms; helpers cost 57% more input, so the decision rule says cut further. Recovery across runs was not exercised.

- [x] **7. Slim helper:** after milestone 6 and Codex's review, one helper with init, capture (with the inventory/dropped check and earlier-run decisions), resolve (short ids, flat fields) and summary; no task list; current run found from `CURRENT`; posting reads delegated from three postings up. Fixture-tested; no agent run yet.
- [x] **8. Hand-off and recovery rehearsal:** same reader model and delegation policy in both arms; a delegated employer batch containing known vacancies under alternate URLs and IDs; an interruption after assessment and before import, resumed by a fresh agent. Compare retained vacancies, repeated reads and ratings, duplicate imports, summary accuracy, native tokens and CLI cost against the plain routine (b66c262). **Result (2026-11-21, two repetitions per arm, prompt-level stop):**
  - Both arms lost nothing, made no duplicate imports, kept the same-title new requisition and reused every saved rating.
  - The helper rated no known vacancy (plain: 3 per repetition, none imported), but it repeated more work after resuming.
  - It cost 15% more, so the decision rule says shrink to the capture check.
- [x] **9. Cheaper resume:** after Codex's review of milestone 8. `init` continues today's unfinished run and lists result files never captured; `summary` ends a run. The routine resumes from saved source evidence and extracts and retries only under the retry rules (7d2529c). Fixture-tested; no agent run yet.
- [x] **10. Unannounced interruption and next-day rehearsal:** one capped pair (about USD 5) on the same base, with state handling as the only difference; a plain ledger with equally explicit save points is the comparator. Several sources with aliases, a same-title requisition, an out-of-scope role, partial pagination, a transient failure and a due refresh. An unannounced kill once a subagent result file is saved, then a next-day run with the normal prompt. Judge against frozen ground truth: retained vacancies, inappropriate imports, unfinished due work, redundant reads and ratings, duplicate imports, summary accuracy, billed cost (cached and uncached input separately). Keep the carry-over only if it prevents a loss or unfinished due work that the plain ledger misses. **Result (2026-11-22, one pair on 7d2529c, USD 2.78):**
  - Both arms imported 5/5 relevant vacancies, made no wrong or duplicate imports, rated no known vacancy and finished all due work.
  - The carry-over prevented nothing the plain ledger missed and cost 12% more, so the rule says shrink.
- [x] **11. Break-even helper:** cut what milestone 10 showed costing more: compact one-line `capture` output with a short note, no re-printing of captured files or reading RUN_STATE.md, open finds of earlier runs moved into the current run (no `--run`), and `summary` counting this run's ratings by basis and source outcomes from source-evidence.jsonl. The routine also asks for filtered file reads and independent tool calls in one turn, which applies with or without the helper. Fixture-tested; no agent run yet.
- [ ] **12. Break-even check:** repeat milestone 10's pair on the milestone 11 base, with the same general output rules in both arms, and a cost cap. Keep the helper if it costs at most about the plain arm's and loses nothing; otherwise shrink to the capture check. Not started.

## Current next action

Milestone 12, when the user starts it. Real runs are Claude desktop scheduled tasks or Codex automations, not the CLI: rehearsal costs compare arms, but absolute costs and cache pricing differ there.

## Why this design

The earlier rehearsal lost plausible extracted job vacancies, began discovery before formal run capture, stalled in browser access and produced inconsistent summaries. Files helped continuity, but did not establish autonomous recovery or token savings. Original local evidence: [report](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REPORT.md), [prompt log](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REHEARSAL_PROMPT_LOG.md). These ignored artifacts may be absent elsewhere. Design initially reviewed with gpt-6.1-sol at Medium effort.
