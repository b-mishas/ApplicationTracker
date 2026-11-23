# State-driven search orchestration

**Goal:** find relevant vacancies, assess them and store them reliably with economical context use.

## How to use this roadmap

Consult before changing search sequencing, capture, checkpoints, recovery, retention or reporting. **Check code before assuming implementation.** Amend the roadmap only when the **overall plan changes** (scope, priorities, sequencing or design direction); do not expand it for routine progress. Put details, decisions and verification in [ORCHESTRATION_HISTORY.md](ORCHESTRATION_HISTORY.md), current checkout state in [HANDOFF_AGENT.md](../../HANDOFF_AGENT.md). Keep brief accomplishments in [root HISTORY.md](../../HISTORY.md) and only a pointer in [PLAN.md](../../PLAN.md). This is maintainer guidance, not scheduled-run context or a pristine template.

The [routine](../ROUTINE_PROMPT.md), [workflow](../../app/SEARCH_WORKFLOW.md), [interface](../../INTERFACE_FOR_TRACKER.md) and [batch schema](../../app/batch.schema.json) remain the runtime contracts. Update affected prompts and pristine copies together.

## State and responsibilities

| Artifact | Purpose |
|---|---|
| run-completion.json | **Identify the run.** Records its id, start time, status, profile hash and the result files its ledger took in (older run-state folders: manifest.json). Unfinished source work is carried in coverage.json `unfinished`, not in a separate task list. |
| run-ledger.jsonl | **Keep track of every discovered job vacancy.** Kept by the agent: one line per find with identity, source, state and decision, so unfinished work is not lost. The newest entry of a vacancy across runs counts. |
| source-evidence.jsonl | **Show what was actually checked.** Records search methods, pages/items inspected, coverage evidence, failures and where to continue. |
| coverage.json | **Decide what to check next time.** Remembers successful source checks, reusable access methods, dropped vacancies and refresh/recheck history across runs. |
| Inventory and importer reports | **Show what was stored.** jobs.json source files tell which run added or touched a record, regardless of retries; importer reports give counts and records to repair. |

The agent keeps the ledger itself and calls one read-only script, `capture-check.mjs`: per find `known`/`similar`/`new` against the inventory and dropped list, and `--open` for finds of any run still needing work (including decisions under another profile). It judges relevance and evidence. **Only the existing importer writes inventory.** The retired run-state helper (milestones 5–12) is in commit 92e1d73.

**Terminology:** a job vacancy is a discovered role; the candidate is the human job seeker. Existing code/file identifiers containing `candidate` remain unchanged for compatibility.

**Where details live:** ledger fields, capture-check use and source-evidence and coverage procedures are in ROUTINE_PROMPT.md; the script's behaviour is in its header and tests. Verify exact validation against the script and batch schema. The history explains decisions and test evidence; it is not the field contract.

## Invariants

- **Capture immediately**, including setup discoveries, before selecting postings to investigate. Every captured job vacancy has a disposition or remains discoverable as pending.
- **Check finds at capture.** A find sharing a provider ID or posting URL with any inventory record or dropped entry is recorded as a duplicate before anyone reads or rates it; name-only matches are left to the agent.
- **Reconcile before finishing.** Every find still open is decided or reported as not done, and stays listed for the next run whether or not its run is finished.
- **Keep bookkeeping cheap.** Every helper call costs a lead turn that re-reads the whole context. Prefer one call per batch of finds and one per batch of decisions; put command lines in the routine so the agent need not read the contracts.
- **Assessment is not delivery.** Preserve reusable results and distinguish prepared batches from confirmed imports. Deduplicate conservatively; retain distinct vacancies and source occurrences.
- Save after discovery/result batches, assessments, source attempts and imports, and before blocking calls—not after every tool call. On restart, inspect saved pending work before repeating external work.
- Respect current scope and profile revisions. Temporary exclusions never become permanent preferences. Resume mutable listings with overlap and deduplication.
- **Source coverage needs evidence.** Partial listings never earn successful check dates; cached methods and task labels do not prove coverage.
- Derive delivery and "added this run" from the inventory, not from per-attempt receipts. The importer is idempotent, so an interrupted import is simply rerun; its report describes the latest attempt only.
- Preserve unresolved work and all dependencies. Current policy retains all runs; destructive pruning remains deferred. No automatic legacy migration.
- Derive counts from saved state and evidence. Identify uncertainty and differing count scopes explicitly; never invent missing metrics or coverage.
- Use one lead writer; subagents only write result files. State cannot interrupt blocked tools or recover discoveries the agent never captured.

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
- [x] **12. Break-even check:** repeat milestone 10's scenario on the milestone 11 base with three arms, one run each and a USD 5 cap: the full helper, capture check only (a small script that prints `known`/`similar`/`new` and writes nothing, with the agent keeping a plain ledger), and the plain ledger. All three keep the base's general output rules. Choose the full helper only if it is measurably cheaper or more correct than both; otherwise capture-only if it loses nothing and costs no more than the plain ledger (about 10% noise allowed); otherwise the plain ledger. **Result (2026-11-22, on 92e1d73, USD 3.41):**
  - Costs: helper USD 1.10, capture-only 1.05, plain 1.09.
  - The plain ledger silently lost one relevant vacancy (a same-title second requisition left pending).
  - The helper and capture-only arms kept it, but imported one out-of-scope role on a rating judgement.
  - Under the frozen wording the rule picks the plain ledger; read as "loses no vacancy", it picks capture-only. Codex's review called NK-24318 a policy ambiguity, kept the literal result on record and recommended capture-only with a finish-time check of open finds.
- [x] **13. Capture check as default:** `app/capture-check.mjs` (known/similar/new, and `--open`) with the agent's own run ledger; run-state.mjs and candidate-ledger.mjs retired (recoverable from 92e1d73). After Codex's implementation review: `--open` covers all runs (newest entry per vacancy), lists unknown states and unreadable ledgers, and flags decisions under another profile via a per-run profile hash. Fixture-tested; no agent run yet.

## Why this design

The earlier rehearsal lost plausible extracted job vacancies, began discovery before formal run capture, stalled in browser access and produced inconsistent summaries. Files helped continuity, but did not establish autonomous recovery or token savings. Original local evidence: [report](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REPORT.md), [prompt log](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REHEARSAL_PROMPT_LOG.md). These ignored artifacts may be absent elsewhere. Design initially reviewed with gpt-6.1-sol at Medium effort.

## Current next action

Observe a few ordinary scheduled searches with the capture check: what `--open` lists at start and finish, whether Not done agrees with it, and cost against earlier runs; revisit parts of the full helper only for failures they would have prevented (for example a listing gone before a resume, leaving saved extracts as the only copy). Real runs are Claude desktop scheduled tasks or Codex automations, not the CLI: rehearsal costs compare arms, but absolute costs and cache pricing differ there.
