# State-driven search orchestration

**Goal:** find relevant vacancies, assess them and store them reliably with economical context use.

## How to use this roadmap

Consult before changing search sequencing, capture, checkpoints, recovery, retention or reporting. **Check code before assuming implementation.** Amend the roadmap only when the **overall plan changes** (scope, priorities, sequencing or design direction); do not expand it for routine progress. Put details, decisions and verification in [ORCHESTRATION_HISTORY.md](ORCHESTRATION_HISTORY.md), current checkout state in [HANDOFF_AGENT.md](../../HANDOFF_AGENT.md). Keep brief accomplishments in [root HISTORY.md](../../HISTORY.md) and only a pointer in [PLAN.md](../../PLAN.md). This is maintainer guidance, not scheduled-run context or a pristine template.

The [routine](../ROUTINE_PROMPT.md), [workflow](../../app/SEARCH_WORKFLOW.md), [interface](../../INTERFACE_FOR_TRACKER.md) and [batch schema](../../app/batch.schema.json) remain the runtime contracts. Update affected prompts and pristine copies together.

## State and responsibilities

| Artifact | Purpose |
|---|---|
| run-completion.json | **Guide and resume the current run.** Records its tasks, progress, limits and next actions, together with scope/profile context and saved import attempts. |
| run-ledger.jsonl | **Keep track of every discovered job vacancy.** Preserves its identity, sources, assessment and current disposition so unfinished work is not lost. |
| source-evidence.jsonl | **Show what was actually checked.** Records search methods, pages/items inspected, coverage evidence, failures and where to continue. |
| coverage.json | **Decide what to check next time.** Remembers successful source checks, reusable access methods, dropped vacancies and refresh/recheck history across runs. |
| Batches and receipts | **Track what was submitted and stored.** Preserve exact import payloads, hashes, vacancy mappings and confirmed or uncertain outcomes for each attempt. |

Use existing `candidate-ledger.mjs` and `run-state.mjs` helpers for bookkeeping; the agent judges relevance and evidence. **Only the existing importer writes inventory.** Contracts: [CANDIDATE_STATE.md](../../app/CANDIDATE_STATE.md), [RUN_STATE.md](../../app/RUN_STATE.md).

**Terminology:** a job vacancy is a discovered role; the candidate is the human job seeker. Existing code/file identifiers containing `candidate` remain unchanged for compatibility.

**Where details live:** ledger fields and assessment rules are in CANDIDATE_STATE.md; manifest commands, scope guards, snapshots and receipt recovery are in RUN_STATE.md. Source-evidence and coverage procedures are in ROUTINE_PROMPT.md. Verify exact validation against the helpers and batch schema. The history explains decisions and test evidence; it is not the field contract.

## Invariants

- **Capture immediately**, including setup discoveries, before selecting postings to investigate. Every captured job vacancy has a disposition or remains discoverable as pending.
- **Assessment is not delivery.** Preserve reusable results and distinguish prepared batches from confirmed imports. Deduplicate conservatively; retain distinct vacancies and source occurrences.
- Save after discovery/result batches, assessments, source attempts and imports, and before blocking calls—not after every tool call. On restart, inspect saved pending work before repeating external work.
- Respect current scope, profile revisions, stops, deadlines and budgets. Temporary exclusions never become permanent preferences. Resume mutable listings with overlap and deduplication.
- **Source coverage needs evidence.** Partial listings never earn successful check dates; cached methods and task labels do not prove coverage.
- Preserve immutable import attempts and mappings. Missing receipts leave original outcomes **unknown**, even after successful retries. The importer commits inventory before writing its report, and retries may overwrite the report path. Preserve batch hashes, job-vacancy-to-batch mappings and per-attempt receipts; never use a later report to invent an earlier outcome. Inventory and receipt writes are not one transaction.
- Preserve unresolved work and all dependencies. Current policy retains all runs; destructive pruning remains deferred. No automatic legacy migration.
- Derive counts from saved state and evidence. Identify uncertainty and differing count scopes explicitly; never invent missing metrics or coverage.
- Use one lead writer and atomic updates. State cannot interrupt blocked tools or recover discoveries the agent never captured.

Avoid a database/framework, transcript archives, **serialized conversation state**, copied page dumps, duplicate manual counters and per-call narrative diaries. Keep compact evidence sufficient for decisions and recovery.

## Milestones and acceptance

- [x] **1. Capture:** durable job-vacancy ingestion and reusable assessments across setup/routine boundaries. Seven captured, three assessed, four pending survive fresh-process recovery.
- [x] **2. Recovery:** scope/profile guards, pending queries, saved cursors, immutable import attempts, unknown-outcome reconciliation and safe retention. Required interruption checks cover extraction, assessment, batch creation, inventory commit, report write and archival, including partial/ambiguous imports, missing/overwritten reports and preserved user fields. See history for which checks are implemented and their limits.
- [x] **3. Reporting:** generated job-vacancy/task/import totals and aligned prompts. Counts reconcile or expose uncertainty; no unsupported source-coverage claims. Details and limitations are in the history.
- [x] **4. Live measurement (narrow evaluation concluded, limitations recorded):** compare equivalent continuous and interrupted agent runs for retained job vacancies, outcomes, repeated external reads and native token use. Report excluded capabilities and unavailable measurements. A narrow check is not full setup, browser or platform acceptance.

Use isolated rehearsal inventories and fictional profiles, **never real application records**. Include stale profiles, run-only exclusions, changed pagination, a 31-day-old unresolved job vacancy and its referenced payload and user-owned fields in relevant tests. Measure token savings before claiming them.

## Current next action

Narrow live measurement is concluded: fresh-agent assessment reuse and one import per arm verified, native usage recorded. Resumed reporting was completed locally after interruption; autonomous reporting acceptance and token savings remain unproven. See the history for results. Broader discovery, smaller-model acceptance and additional measurements are follow-up work, not established by this rehearsal.

## Why this design

The earlier rehearsal lost plausible extracted job vacancies, began discovery before formal run capture, stalled in browser access and produced inconsistent summaries. Files helped continuity, but did not establish autonomous recovery or token savings. Original local evidence: [report](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REPORT.md), [prompt log](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REHEARSAL_PROMPT_LOG.md). These ignored artifacts may be absent elsewhere. Design initially reviewed with gpt-6.1-sol at Medium effort.
