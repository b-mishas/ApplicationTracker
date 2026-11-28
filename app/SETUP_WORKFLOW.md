# Setup state and recovery

This is the installed setup helper contract. Personal facts remain in the profile and workbook. The helper never infers user consent or changes a schedule. It checks evidence consistency; JSON cannot prove that an assistant honestly observed consent, permissions or execution context.

## Entry and safe editing

### Original step-to-prerequisite map

| Step | Inputs / prerequisites | Saved result and approval | Failure / next action |
|---|---|---|---|
| 1 Installation | ROOT, runtime, available tools, timezone when needed | Capability evidence and self-check; no inferred personal approval | Essential access blocked: explain early; independent personalization may continue |
| 2 Background | CV or user facts, example context | Profile §1 drafts and separate historical reading evidence | Ask missing facts; do not invent experience |
| 3 Interview | Supported facts and missing decisions | Profile §1–7/9 topic approvals | Save unknown/declined/not applicable and block dependent topics only |
| 4 Calibration | Draft fit definitions and facts, full example reads | §8 approval plus calibration dependency fingerprint | Discuss threshold disagreements and revise general rules only |
| 5 Interface | Runtime/ROOT and chosen export language/timezone | Documented settings, installation evidence | Preserve schema/code; fix setup cause |
| 6 Employers | Approved scope and existing workbook | Reviewed additions/edits, employer fingerprint | Revision conflict/Excel lock: reread or close Excel, preserve rows |
| 7 Alerts | Sources and Gmail tools, label, look-back | §10 approval, Part A settings, Gmail evidence | No Gmail: operation blocked, not negative personal preference |
| 8 LinkedIn | Available browser, user-established session | Capability evidence; explicit limitation and §10 consequence if accepted | Optional limitation needs consent; employer fallback |
| 9 Prompt | Calibrated topics, sources/settings, checkpoint review | Filled prompt, exact Part B, final assembled approval | Placeholders/stale topics/reset receipt: resolve before activation |
| 10 Task | Platform capabilities, stopped existing tasks, approved configuration | Identified task, readback, schedule confirmation, final installation approval | Ambiguity: clarify; never create another task blindly |
| 11 Verification | Active approved configuration in actual scheduled context | Probe/import/finish/source evidence and three derived outcomes | Distinguish installation failures, optional limitations and search backlog |

From ROOT, run `node app/setup-state.mjs inspect`. This reads artifacts and returns `state`, its `revision`, and derived `readiness`; it writes nothing. Missing state means legacy/unknown approval, not a fresh installation. Malformed/unsupported state fails without replacing it: retain the original, diagnose it, and obtain explicit agreement on recovery. Do not delete it to force initialization.

Before editing live personal artifacts, identify **all** tasks targeting ROOT, pause them with existing authorization or ask for it, and verify that active searches have ended. A paused schedule does not stop a run already in progress. Do not mistake an old unfinished run folder for a currently running process: consult platform execution state. If task discovery or active-run inspection is unavailable, ask the user to confirm those steps. Never create another task to resolve uncertainty. This is also required for legacy tasks whose installed prompts predate the guard.

`node app/setup-state.mjs init` creates private state only if absent. It preserves all existing personal files, starts every topic as missing, and sets `phase: editing`. No fresh-install assumption or approvals are inferred. New prompts call `node app/setup-state.mjs guard` before reading configuration or searching; missing state permits legacy operation only when reset recovery is clear, while malformed state/receipt, an unfinished reset, editing phase or stale approvals block the run (exit 2). The guard does not scan search progress. This cooperative guard does not stop an already-running or older installed task. The importer remains independently usable; it has no setup gate.

## Save and approval contract

Save proposed state as a UTF-8 JSON file inside `data/reports/`, then run:

    node app/setup-state.mjs save --input data/reports/setup-next.json --expected-revision HASH

`--input` supplies the proposed state; `--expected-revision` is the revision from the latest inspect. Concurrent/stale saves are rejected. The helper locks the reports folder using the existing lock utility, validates, saves a private previous-state backup, and atomically replaces state. Use `--root ROOT` only when operating outside ROOT. Never place personal temporary state in tracked folders.

Required version-1 fields: `schemaVersion: 1`, `setupId` (preserve), `updatedAt` (helper stamps system UTC), `phase` (`editing` or `active`), `topics`, `questions`, `capabilities`, `limitations`, `discoveryRuns`. Optional evidence: `task`, `scopeReview`, `finalApproval`, `verification`, `quiescence`. Preserve helper-owned `lastActiveScope` and `lastActiveScopeParts`; only activation (editing to active) updates them. Inspect validates the shape of every optional object, and `basis` must be a readiness hash, not a description. `discoveryRuns` lists setup discovery run folder names (see Setup discovery runs below). The helper keeps the newest 50 previous-state backups. Unknown-version files cannot be migrated automatically.

Topics and their authoritative profile sections:

| Topic | Sections or artifact |
|---|---|
| background | §1 |
| roles | §2 |
| seniority | §3 |
| geography | §4 |
| strengthsGaps | §5, §6, §7, §9 |
| calibration | §8; also save `basis: readiness.calibrationBasis` after review |
| sources | §10; also save `basis: readiness.suitabilityBasis` after review |
| employers | Workbook row values excluding row number, Last checked and Careers page; also save `basis: readiness.suitabilityBasis` after review |
| personalSettings | Filled Part A |

Each topic has `status`: missing, draft, needs_answer, approved, needs_review. For approval, first save the artifact, show the exact proposed content and obtain user approval. Then set `approval: {by: "user", at: <system UTC>, evidence: <short confirmation reference, not a transcript>, fingerprint: <readiness.snapshot.fingerprints[topic]>}`. Calibration also needs `basis: readiness.calibrationBasis`. Approval statuses are checked against current artifacts on every inspect. A changed fingerprint yields effective needs_review without destroying the previous evidence. Ordinary workbook activity does not invalidate approval. Do not copy facts into setup JSON. Clear temporary unresolved answers once reconciled into the profile.

Sources and employers also store `basis: readiness.suitabilityBasis`. It covers background inputs (excluding the Name line), roles, seniority, geography and §7/§9 listing exclusions, so changing eligibility or an explicit exclusion requires reviewing their suitability even when their own content is unchanged. Strengths and gaps (§5–6) affect assessment only and make calibration stale. Mismatch signals (§7) also filter discovery and therefore affect suitability and replay, like §9. Keep the same employers/sources where still appropriate, then record renewed approval against that basis; do not automatically replace them.

`basis` belongs on the topic object alongside `status` and `approval`, not inside `approval`. For example, an approved employers topic has `{status: "approved", approval: {by, at, evidence, fingerprint}, basis: readiness.suitabilityBasis}`. Inspect returns `topicBlockers[topic]` and structured `blockers` explaining missing dependency evidence, outdated inputs, artifact drift and other readiness failures; follow the stated correction rather than repeatedly reapproving only the content fingerprint. Blockers are ordered by prerequisite (reset, Gmail feasibility, topics in topic order with their questions, profile/limitation/discovery checks, prompt, scope review, final approval), and `next` is the first one. A profile blocker names the offending line numbers; quoted template guidance (lines starting with `>`) is ignored.

The whole background topic still needs approval after a name correction. Dependency fingerprints separately exclude only the recognized `Name:` line (optional list bullet, matching the supplied profile format). Authorization, role/experience, base location, languages and unknown background prose remain dependencies conservatively. Do not rename factual fields to Name to bypass review. Corrections to a descriptive name do not require calibration, employer/source suitability approval or checkpoint replay; the assembled configuration and any changed filled prompt still need their applicable approval/comparison. Existing saved hashes that differ after a helper correction become stale; never silently rewrite their approval evidence.

Questions: `{id, topics: [topic IDs], question, answer: "unknown"|"declined"|"not_applicable", blocking: boolean}`. Answered facts go in the profile, then remove their question. Declining an essential answer does not make it optional: explain the consequence and resolve whether that topic can be approved. Capabilities: keyed objects `{status: "untested"|"verified"|"failed"|"unavailable", context: "interactive"|"scheduled", observedAt, ref}`. Record the Gmail test as `capabilities.gmail`: it must be `verified` (in any context) before activation, while personalization readiness is reported independently of it. References name retained evidence under ROOT; never store credentials or CV/mail/transcript content.

Limitations: `{consequence, profileRef: "§N" (an existing profile section), acceptedBy: "user", acceptedAt}`. A §10 `LinkedIn direct reading: disabled` line without a §10 limitation entry blocks readiness: the standing rule needs recorded consent. Put standing source/reading consequences into approved profile §10; setup state is not read as search instructions. Transient failure is evidence, not a permanent exclusion. A user may accept no direct LinkedIn reading while retaining employer lookup for LinkedIn alerts. Record this as **LinkedIn direct reading: disabled; employer fallback only** in §10; remove LinkedIn from direct portal rotations if appropriate. Never silently disable alerts or claim LinkedIn descriptions were read. Gmail remains essential for this routine.

## Scope changes and checkpoint recovery

Record `scopeReview: {fingerprint: readiness.snapshot.scope, evidence: <review reference>}`. Existing coverage plus a changed/unknown active scope requires a completed reset receipt, not simply this claim. The scope fingerprint covers what is searched: background inputs (excluding Name), roles, seniority, geography, §10 sources, employer rows (excluding routine-maintained fields), §7/§9 listing filters, the Gmail label and the first-search look-back. Timezone, summary language, Name and strengths/gaps do not change it. §7/§9 do: listing readers use these filters before returning finds, so reassessment cannot recover everything they omitted. Review the first-search look-back with the user; a reset replays within that interval, not all historical vacancies. Older unresolved finds and earlier Gmail intervals remain recoverable under routine rules.

While editing with tasks paused and active runs stopped, run:

    node app/setup-reset.mjs --confirmed-stopped

The receipt records a replay `mode`. If only employer rows changed since activation (`lastActiveScopeParts.search` is unchanged), mode `employers` clears the successful dates and cached methods of the added or edited employers only (listed in `employers`), in both coverage and the workbook, and keeps the Gmail and portal checkpoints. Otherwise, or without activation history, mode `all` resets **all search-source checkpoints**: Gmail through-date, portal successful dates/progress, employer successful dates/cached filtered methods, and workbook Last checked. It retains career URLs, priorities, user content, inventory, dropped entries, refreshes, unfinished work and all run evidence. Whole-scope replay for any non-employer change is intentional until finer source dependencies can be established reliably from prose. Gmail label and first-search look-back changes also require this review/replay. Add `--all-sources` to request mode `all` explicitly after review.

The helper saves previous coverage in private `setup-scope-reset.json` before writing. A started receipt is a recovery journal: keep schedules paused and rerun against the same configuration after an interruption. It clears workbook dates before coverage and marks complete last; retries are safe while no routine runs. Completed same-scope receipts are idempotent. Previous receipts and workbook changes are backed up. Do not alter configuration again while a reset is unfinished. Resume only after receipt completion. No real inventory is edited for setup testing.

An unfinished or malformed reset blocks activation and the routine guard independently of scope equality, even if the previous configuration was restored or setup state is absent. Restore the interrupted configuration and finish its reset normally. If reverting it was intentional, an explicitly reviewed alternative while searches remain stopped is `node app/setup-reset.mjs --confirmed-stopped --recover-current-scope`: archive the unfinished receipt and replay against the current restored scope using its saved pre-reset coverage. This does not cancel the journal or pretend partially written stores are consistent. Unsupported/malformed receipts still need explicit diagnosis; this option cannot overwrite them.

After topics, sources, workbook, exact Part B and filled Part A are approved, inspect again. Set `finalApproval: {by: "user", at, fingerprint: readiness.configuration}` only after showing the assembled configuration. `task`, when present, is `{id, platform: "claude"|"codex", root: <actual configured installation folder>, schedule: <confirmed timezone and recurrence>, promptEvidence: <relative path to installed raw text read back>}`. A task identity/schedule change changes configuration approval; present the final installation details for confirmation. Missing readback leaves operation unverified. Create tasks paused where supported; otherwise use a user-approved non-running installation window. Check for duplicates before creation and reconcile ambiguous existing tasks with the user.

Set phase active only after readiness.activationReady is true (personalization ready plus verified Gmail). Activation also requires verified `capabilities.gmail`, records the current scope and clears `quiescence`. To reconfigure later, first stop schedules/runs and save phase editing with a fresh `quiescence: {confirmedStopped: true, at, evidence}`: `at` must not be older than the last saved state, so a confirmation from an earlier editing session is rejected. Do not edit live artifacts before that boundary. Reuse unaffected topic approvals. Resume the existing task only after activation, prompt comparison and authorization.

## Three separate outcomes

Personalization requires every topic approved/current, no blocking unknown answer, scope review, final approval, no profile placeholders/Example lines, recorded consent for standing limitations, marked setup discovery runs, and exact current Part B in a filled prompt without placeholders. Contradiction detection and factual correctness remain an attended review responsibility.

For operational evidence, set `verification: {operation: readiness.operation, context: "scheduled", runId, gmail: "verified", importReport: <relative importer report>, storageProbe: <relative JSON self-check result>}`. `operation` covers the installed prompt text, installation identity and task identity/schedule/ROOT, not profile wording: a profile edit needs topic and final approval again, but it invalidates operational evidence only when it changes the filled prompt (for example the Part A candidate line). Use only evidence actually observed in the scheduled environment. Save `selfCheck()`'s full JSON result (exported by self-check.mjs) in that run folder with the same ROOT and employer workbook. Its temporary storage probe tests write/replace/backup without touching real records. Also retain source-evidence.jsonl, ledger, run completion, finish.json, installed prompt readback and importer report. The helper requires matching successful non-dry-run import evidence, storage probe, installed text and run identity. Context claims still need observed platform evidence; Run now in a foreground chat is insufficient.

An empty import is valid but skips inventory writes/backups. Report it as **empty import path verified + isolated scheduled storage probe**, never positive insertion verified. Positive import/backup/rendering acceptance uses isolated fictional inventory. Operational verification can succeed with recoverable backlog, but required Gmail/storage/import failure blocks it. Report all three outcomes, including pending/unverified, separately.

### Evolving search progress

Keep `verification.runId` as the historical scheduled-operation proof. Do not replace it just to update search progress. The guard returns `setupId` and `setupScope`; record both in every new run-completion.json. These identify the installation and search scope, separately from its existing whole-profile assessment hash. For an interrupted run, retain its original identity; never retag earlier evidence to the current scope merely to make progress pass. Never assign these fields to legacy runs.

Setup discovery runs: a run folder started during setup carries `setupDiscovery: true` and the setupId in run-completion.json and is listed in `discoveryRuns`; inspect blocks a listed run without that marker. The routine never continues such a folder (nor, when guarded, one lacking the guard identity); it takes it over as an earlier unfinished run (below). A setup discovery run is never the latest search run for progress; capture-check --open still lists its unfinished finds.

Inspect derives `initialSearch` and `searchProgress` independently of operational verification, from records the routine already keeps; it writes nothing and never blocks a search. `complete` requires all of:

- The latest run with this setupId (by startedAt; setup discovery runs excluded) is unambiguous, finished with a valid finish.json (matching runId, searchCoverage complete or partial, a retry array), carries the current scope and started after the last completed reset.
- Nothing carries over: `node app/finish-run.mjs --retry-for` for the next run would print no items. That list is the newest valid finish.json retry plus the due sources of later folders without one. A source is done only when checked in the latest run that selected it or later. finish-run keeps every inherited employer/portal item it did not see checked, so leaving a source out of due.json never cancels it; only a completed setup reset after the item's run does (mode `all`, or mode `employers` for the listed employers), because it makes those sources due again. Runs are ordered by run-completion.json startedAt; folder names only order folders without one, and at equal times an unfinished folder counts as later.
- No run is unfinished and not taken over, and no folder with non-empty files lacks run-completion.json. In a taken-over folder, every find in a JSON or JSON-lines result file is in some run ledger, and every other non-empty file (or result file without a recognizable find) is listed in the taking-over run's run-completion.json `reviewed` as `<run ID>/<path>`. Run records, evidence/reading/mail/link files, summary.md and helper scripts are exempt.
- coverage.json has an empty `unfinished` list, a Gmail checkpoint and a successful date for every source entry, and every workbook employer has a valid successful date in the workbook or coverage.
- capture-check --open lists no open find.

Each blocker states its consequence and the next step, normally the next scheduled run. The routine writes a checkpoint only after a successful check and a reset clears the affected ones, so a set date means checked since the last relevant reset. Limits: a portal that never appears in coverage.json is not detected, because configured portals live in profile prose; within one run, a check is assumed to satisfy any selection of the same source in that run, since selections are made from causes that precede the run or from attempts in it; JSON consistency cannot prove that an external check was performed. Results can move from partial to complete and back.

Keep diagnostic `setup-log.json` compatible: map topic work back to original steps 1–11, recording only done/skipped/blocked/failed and sanitized observed problems. Do not serialize new state or unresolved answers into diagnostics. All setup state, drafts, backups, receipts and evidence live under ignored data/; release builds include helpers/docs only.

Configuration identity uses setupId plus the configured task ROOT, not the execution host's realpath: a legitimate mounted ROOT may have a different pathname. Verify the scheduled task targets the actual installation using owning platform evidence; a copied setupId alone cannot establish that. Pre-reset run checkpoints/mail-completion markers cannot skip replay after a reset; only captured finds/readings remain reusable under the current profile.

## Interrupted runs and takeover

Never delete run folders. The next routine run takes over every earlier unfinished run it does not continue: a pre-reset or setup discovery run, an untagged run under the guard, and a folder without run-completion.json that holds non-empty files. It captures their finds and result files, receives their unchecked due sources through `--retry-for`, and at the end sets `status: "finished"` and `takenOverBy: <its run ID>` (creating a minimal run-completion.json where missing). A folder whose files are all empty needs nothing. If progress reports taken-over finds missing from every ledger or unreviewed files, handle them in an attended run: capture the finds, and list reviewed files in the taking-over run's `reviewed`. No helper certifies extraction or interpretation.

Earlier versions wrote due-selection.json and setup-recovery.json. An unfinished run's due-selection.json sources still count as due, and a setup-recovery.json handover receipt counts as a takeover by its targetRun; an empty classification holds only while the folder is still empty. Their source-work, select-sources and classify-orphan commands are retired, scope transitions are no longer reconstructed and selection times are no longer compared.
