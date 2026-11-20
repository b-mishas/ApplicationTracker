# Orchestration implementation history

Detailed, durable record for future development sessions. Newest verified milestone first. Record implementation, rationale, verification and limitations here; amend [ORCHESTRATION_ROADMAP.md](ORCHESTRATION_ROADMAP.md) only when the overall plan changes. Runtime command/field contracts belong in the linked app documentation; checkout status belongs in [HANDOFF_AGENT.md](../../HANDOFF_AGENT.md). Root [HISTORY.md](../../HISTORY.md) remains the brief project-wide record.

## 2026-11-20 — Local rehearsal closure

- Reconciled the existing successful resumed receipt, archived exact batch bytes and completed import/coverage/summary tasks. Inventory bytes unchanged; no new import, external call or subagent. Derived summary has zero unfinished tasks and one confirmed addition.
- Verified all four narrative sections, skipped/null LinkedIn test, no employer successful date, and source/template parity. Original baseline failures preserved. Fresh-agent reporting retest not performed; resumed reporting completed by orchestrator.
- Narrow step-4 measurement concluded with limitations, not full autonomous acceptance or demonstrated savings. Existing native usage and recovery findings retained in rehearsal/runs/agent-pair-2026-11-20T16-35-39-299Z/REPORT.md.

## 2026-11-20 — Agent-pair evidence recovered after model-selection error

- Three rehearsal agents incorrectly inherited Astra. Stopped active agents; no replacement agents launched. Explicit user rule: Astra orchestrates; subagents use gpt-6.1-sol Medium explicitly, no inherited Astra.
- Audited both inventories and receipts: one fit-4 vacancy imported once in each. Preserved pre-import checkpoint; fresh resume agent reused files with zero external reads and imported successfully before interruption. Import/coverage/summary task closure remains pending.
- Baseline omitted Flags and encoded an excluded LinkedIn test as failed. Corrected source/template instructions and workflow contract; agent retest pending. Not full step-4 completion or a valid completed cost comparison.
- Evidence and native usage: rehearsal/runs/agent-pair-2026-11-20T16-35-39-299Z/REPORT.md, verification.json, native-usage.json. Recover local reporting from existing state; no discovery/import rerun needed.

## 2026-11-20 — Roadmap safeguards restored (side conversation)

- Restored plan-only maintenance rule, root history/plan pointers, essential artifact responsibilities, batch-hash/report-overwrite rationale and explicit interruption/31-day retention verification cases. Prohibited serialized conversation state explicitly.
- Defined job vacancy versus human candidate; roadmap prose now uses job vacancy, preserving code/file identifiers. Added authoritative detail locations; field/command details checked against CANDIDATE_STATE.md, RUN_STATE.md and routine evidence instructions. No runtime changes or rehearsal execution.

## 2026-11-20 — Step 4 preliminary live check

- Simplified roadmap while retaining responsibilities, invariants, milestones, acceptance and limitations.
- One live Contentful posting plus controlled continuous/resumed processing in isolated inventories: one addition each; fresh-process pending response 451 bytes; zero repeated external reads. Evidence: rehearsal/runs/orchestration-live-20261120/REPORT.md and comparison.json.
- Step 4 remains open: not separate live agents, no native token measurement, and manifest initialized after discovery. No token-saving or capture-before-discovery acceptance claim. Next: properly initialized agent-level pair.

## 2026-11-20 — Reporting review and verification completed

- Corrected the premature completion claim. Expanded existing recovery fixtures with summary assertions for unknown attempts, missing post-commit reports, partial/repaired batches, ambiguous matches and cross-run imports. Added CLI/read-only, unattempted snapshot, changed-profile and partial-source checks. Twelve recovery/reporting scenarios pass; this is not twelve new reporting tests.
- Original counts are explicitly null with missing receipts; confirmed unique outcomes remain separately labelled. Task status zeros are explicit. Removed prompt contradictions about zero additions, missing outcomes and source-count equations. Legacy unmapped imports require separate reporting. Source coverage still requires evidence; live adherence/token savings remain unverified.
- Marked roadmap milestone 3 complete at user request without expanding the plan. Next is separately scoped live rehearsal; no installed automation, ZIP, commit or push.

## 2026-11-20 — Derived summary implemented

- Added read-only run-state summary command: ledger dispositions, task statuses, unique candidate import outcomes, unknown attempts and cross-run pending work. Updated routine/setup and pristine copies plus runtime/interface guidance. Unrecorded source metrics remain unknown; task statuses cannot prove source coverage.
- Eleven temporary-fixture recovery/reporting scenarios passed, including repeated-import counting. No live rehearsal, installed prompt update or package build. Summary reads assume one lead writer between updates.

## 2026-11-20 — Orchestration filenames standardized

- Renamed the history and roadmap to ORCHESTRATION_HISTORY.md and ORCHESTRATION_ROADMAP.md at the user's request. Updated project rules, plan, histories, handoffs and compaction references; roadmap content and implementation scope unchanged. Checked renamed references and whitespace; no runtime tests needed.

## 2026-11-20 — Documentation organization and stop boundary

- Renamed ROADMAP.md to ORCHESTRATION_ROADMAP.md, preserving its existing content rather than shortening it. Added links to this history and [COMPACTION.md](COMPACTION.md).
- User clarified: do not inflate the roadmap; amend it only for changes to the overall plan. Routine progress, tests and implementation details belong here. Updated both project rule files accordingly.
- Implementation remains stopped after recovery. The user's earlier “steps 1 and 2” meant recovery and reporting; their later instruction stopped work after recovery. In roadmap numbering, candidate capture and recovery are milestones 1 and 2; reporting is milestone 3. Do not confuse these numbering schemes or treat compaction as authorization to start reporting.
- At this record's creation, main is at b66c2629638f7c1ab14284f872fcfe477ea06592, three commits ahead of origin/main. Capture/recovery work is uncommitted alongside unrelated changes. No push, packaging, installed automation update or live search occurred. Remote/CI state is unverified; recheck the actual checkout before continuing.

## 2026-11-20 — Recovery implemented (roadmap milestone 2)

### Owning files and integration

- [run-state.mjs](../../app/run-state.mjs) implements the recovery helper; [RUN_STATE.md](../../app/RUN_STATE.md) is its command/field contract; [test-run-state.mjs](../../app/test-run-state.mjs) owns the focused fixture suite.
- Extended [candidate-ledger.mjs](../../app/candidate-ledger.mjs) so exclusions/duplicate dispositions can carry the actual profile revision. Older untagged decisions remain readable and are surfaced for review.
- Updated setup/routine prompts and identical pristine copies, [SEARCH_WORKFLOW.md](../../app/SEARCH_WORKFLOW.md), [INTERFACE_FOR_TRACKER.md](../../INTERFACE_FOR_TRACKER.md), package test sequence and future release-builder file inclusion. Existing ZIPs and installed filled prompts/schedules were not regenerated.

### Implemented behavior and reasoning

- Version-1 run-completion.json is a live task manifest, not an end-of-run prose checklist. It stores scope/exclusions, actual profile hash, deadline, stop reason, task states, source labels, continuation hints, declared call budgets, import snapshots and attempts.
- Task updates require the current file revision. Active work is refused for blocked context, excluded sources or exhausted declared budgets. Calls cannot decrease; task identity and budget are fixed within a run.
- Context changes reread the profile hash. They do not silently clear a stop or deadline; explicit resume clears a stop, and explicit authorized deadline changes are required. Expired temporary exclusions trigger review rather than automatic scope widening.
- Cross-run discovery returns compact unresolved tasks, candidates and import attempts, including setup captures. It flags stale assessments and preserves unsupported/corrupt legacy evidence. Reusing old results still requires current scope and profile; due scheduling remains the agent's responsibility.
- Preparation saves immutable batch text/hash and an ordered candidate mapping before any inventory write. Candidate fingerprints let receipt-based delivery remain separate from assessment and become stale after changed decisions.
- Import execution calls the existing importBatch function. The existing importer/store retains exclusive ownership of inventory validation, locking, backups and user-owned fields. Later changes to the incoming file cannot change the saved snapshot.
- Full per-attempt receipts preserve original outcomes through retries. Matching reports can recover the latest interrupted attempt. A later retry's report cannot fill an earlier missing receipt.
- A missing receipt/report never proves no inventory write: the importer commits inventory before reporting. Unknown original outcomes stay unknown even when a later idempotent retry reports unchanged. Blind retries of ambiguous/rejected records are refused; confidently repaired batches get a new snapshot, retaining prior evidence.
- All run folders are retained. This protects unresolved work, old evidence and cross-run receipt references. No automatic deletion or dependency-aware destructive pruning was implemented.

### Verification performed

Ten temporary-fixture scenarios passed:

1. Fresh-process discovery of setup candidates and unfinished source cursors; stale revision and unsupported completion claims rejected.
2. Scope expiry, stop/resume, profile drift, deadline preservation and exhausted call budgets block work appropriately.
3. Saved snapshots survive changed incoming files; repeated confirmed imports return receipts without another inventory write.
4. Interruption after intent leaves an unknown attempt; inspected retries preserve that uncertainty.
5. Interruption after inventory commit/report recovers the full receipt without reimporting.
6. Missing reports after commit remain unknown; subsequent unchanged results do not erase uncertainty or add duplicate records.
7. Partial imports leave rejected candidates undelivered; repaired snapshots settle known rejected mappings without duplicating accepted records.
8. Ambiguous receipts remain unresolved and refuse blind retry.
9. Unrelated reports are not adopted; locks and excluded scope are respected; archived incoming batches do not prevent recovery.
10. Cross-run delivery and refresh preserve user fields; old pending and legacy evidence remain recoverable/preserved.

Candidate-ledger regressions also passed. The importer suite passed 57/57 with localhost access. Its initial sandbox run passed 56/57: the concurrent UI/import test failed because loopback fetch returned EACCES, independently reproduced with an isolated local HTTP probe. The rerun resolved this environment restriction; no importer code fix was needed. Test servers were stopped.

Helper/builder syntax, exact source/template parity, Markdown targets, release-file inclusion and whitespace checks passed. These were source/fixture checks, not packaged installation or live-agent acceptance.

### Limitations and pending work

- Reporting generation and derived counters were deliberately not implemented. Existing manual summary requirements remain; the user requested stopping before that step.
- No live rehearsal or token-saving measurement. Source coverage, actual browser recovery and agent compliance with capture/checkpoint instructions remain unproven by these fixtures.
- No automatic task scheduling, legacy migration, destructive pruning or tool-timeout enforcement. Declared call counts/evidence depend on accurate agent input; a helper cannot capture a vacancy omitted from its input.
- One lead writes state serially; subagents return artifacts. Killed writers may leave locks/snapshots requiring deliberate inspection. Never steal a potentially active lock.
- Atomic file replacement does not make inventory plus receipt writes one transaction or guarantee protection against every filesystem/power failure. Unknown outcomes are an intentional supported state.
- Automatic archival is not implemented; existing exact-batch/report conditions still apply. Runtime contracts document the legacy/unmapped-batch fallback.
- Other operating systems, physical devices, full UI acceptance and rebuilt distributions were not tested for this feature.

## 2026-11-19 — Candidate capture implemented (roadmap milestone 1)

- Added [candidate-ledger.mjs](../../app/candidate-ledger.mjs), [CANDIDATE_STATE.md](../../app/CANDIDATE_STATE.md) and [test-candidate-ledger.mjs](../../app/test-candidate-ledger.mjs).
- Versioned JSONL stores original discovery, source occurrences, timestamps, disposition and reusable assessment evidence/profile revision. States distinguish pending, assessed, excluded and duplicate; assessed does not mean imported.
- Identity conservatively uses provider/company/requisition ID, otherwise URL plus advertised company/title/location, otherwise source occurrence and advertised identity. Title similarity alone never merges vacancies. Shared search URLs cannot collapse different roles; aliases/wrappers/enrichment may still need explicit duplicate review.
- Repeated capture merges source occurrences without discarding assessments. Resolve requires the current ledger revision. The helper validates an entire batch, writes/syncs a temporary file, and renames it under a per-ledger exclusive lock. Legacy evidence is not silently replaced.
- Setup capture begins before example-posting reads or live calibration discovery. Routine instructions preserve setup results. Age-only deletion was suspended so unfinished findings could not be erased.
- Verified seven captured/three assessed/four pending in a fresh process; reusable assessments, source merging, distinct IDs/shared URLs, BOM CLI input, stale revisions, invalid-batch and simulated interrupted-write preservation, lock refusal, dispositions and legacy preservation. Full live recovery was not established by this milestone alone.

## 2026-11-19 — Design evidence and decisions

- A requested gpt-6.1-sol Medium review examined the retained rehearsal [REPORT.md](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REPORT.md) and [REHEARSAL_PROMPT_LOG.md](../../rehearsal/runs/terra-rehearsal-20261119T201042Z/evaluation/REHEARSAL_PROMPT_LOG.md); the lead evaluated the recommendations. These ignored local evidence files may be absent in another checkout.
- Search had returned plausible candidates that never entered the ledger. Source partial status did not protect them. Calibration discovery preceded the formal run folder; capture therefore starts during setup.
- A new session used files successfully but also received fresh scope instructions. That was evidence for file-based continuity, not proof of autonomous interruption recovery.
- Browser selection stalled for 328 seconds and required controller interruption. Checkpointing protects prior work; it does not impose a timeout on a blocked tool.
- Import preservation worked in the sampled case, while summary/counter reconciliation failed. Existing prompt requirements were insufficient; deterministic capture/recovery bookkeeping was chosen.
- Avoid narrative diaries, full page/transcript dumps, a database or a general orchestration framework. Keep the agent's judgment for relevance/fit and use small helpers for state operations. Token savings are a hypothesis to measure, not an established outcome.
- Preserve successful coverage separately from candidate processing; never advance dates for partial listings. Treat cursors on changing listings as hints and resume with overlap/deduplication.

## Next session

Follow [COMPACTION.md](COMPACTION.md). Recheck current checkout and owning code. Preserve unrelated work. Wait for the user's next instruction before starting reporting; this record does not authorize committing, pushing, packaging, changing installed automations or launching a live search.
