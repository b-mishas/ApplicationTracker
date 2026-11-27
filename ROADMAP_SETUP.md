# State-driven setup — implementation roadmap

Status: implementation in progress, 2026-11-27. Contracts, state/recovery helpers, revised setup/routine instructions and the second review fixes (section 5) are implemented and fixture-tested; live setup, platform and recipient acceptance remain open. This is maintainer guidance, not an installed setup prompt or scheduled-run instruction. Installed helper contract: [app/SETUP_WORKFLOW.md](app/SETUP_WORKFLOW.md).

## Contents

1. [Implementation milestones](#1-implementation-milestones)
   - ✅ [M1 — Specify state and readiness contracts](#-m1--specify-state-and-readiness-contracts)
   - [M2 — Add durable state and conservative resume](#m2--add-durable-state-and-conservative-resume)
   - [M3 — Rework the interview and calibration](#m3--rework-the-interview-and-calibration)
   - [M4 — Move feasibility early and make installation repeatable](#m4--move-feasibility-early-and-make-installation-repeatable)
   - [M5 — Preserve discovery handover and verify readiness](#m5--preserve-discovery-handover-and-verify-readiness)
   - [M6 — Integrate and rehearse](#m6--integrate-and-rehearse)
2. [Objective and boundaries](#2-objective-and-boundaries)
3. [Original baseline and problems addressed](#3-original-baseline-and-problems-addressed)
4. [State and ownership](#4-state-and-ownership)
5. [Execution model and dependencies](#5-execution-model-and-dependencies)
6. [Completion contract](#6-completion-contract)
7. [Verification scenarios](#7-verification-scenarios)
8. [Next action](#8-next-action)

**Progress key:** a checked implementation item means the helper or instruction change is present; record whether its evidence is a fixture test, instruction review or live verification. An unchecked item still needs implementation or acceptance evidence. ✅ marks a milestone whose implementation and acceptance tasks have all passed. Keep remaining acceptance work as explicit unchecked tasks, not only prose. M1 is complete. M2–M5 have implementation in place; their acceptance depends on the attended rehearsals in M6. The unmarked design/reference sections are not unfinished implementation milestones.

## 1. Implementation milestones

Unchecked items remain open acceptance work even where helpers or instructions have been implemented. Record implementation and verification evidence separately; do not infer platform acceptance from code presence or fixture tests.

### ✅ M1 — Specify state and readiness contracts

- [x] Map each current setup step to required inputs, artifacts, approvals, failure handling and prerequisites.
- [x] Finalize the minimal schema, allowed states, stale-approval handling and diagnostic boundary.
- [x] Define required versus optional source capabilities. Gmail remains required for the current Gmail-based routine; direct LinkedIn access can be an explicitly accepted limitation with employer-page fallback. A Gmail-free mode requires a separate routine design decision.
- [x] Define the three outcomes in section 6 and document legacy installations without state.

Acceptance: walkthroughs of fresh setup, partial setup and reconfiguration reach an unambiguous next action; contradictory states cannot count as ready. Schema validation proves structure only, never user approval or factual truth.

### M2 — Add durable state and conservative resume

- [x] Implement state persistence and validation with existing Node facilities. Prefer a small validator/persistence helper only where it prevents concrete errors; no framework or per-tool bookkeeping.
- [x] Detect missing, malformed and unknown-version state; reconcile actual artifacts before trusting status flags.
- [x] Implement targeted invalidation and preserve approved unaffected topics.
- [x] Discover an existing scheduled task before creation. If creation succeeded but recording its ID failed, reconcile by installed prompt/folder and task details; ambiguous matches require clarification, not another task. (Instructions only; platform task discovery is unrehearsed.)
- [x] Preserve existing employer rows and configuration. Use wholesale replacement only for an explicitly reviewed replacement; it is not a resume default.

Acceptance tasks (run as part of the M6 attended rehearsals):

- [ ] Verify fresh-session recovery after each save boundary retains saved answers and approved content, including artifact/state mismatches and stale approvals.
- [ ] Verify task discovery and recovery on each supported platform, including interruption after task creation; no duplicate task is created.

### M3 — Rework the interview and calibration

- [x] Extract CV-supported facts first; ask only missing or ambiguous questions, at most six per message and fewer when complex.
- [x] Distinguish confirmed experience, interests, uncertainty, hard constraints and preferences. Scope every always/never rule.
- [x] Resolve conflicts such as keeping below-level roles versus always dropping junior roles, and incomplete source rotations.
- [x] Collect strong, borderline and unsuitable calibration examples, including the 2/3 boundary. Record the assistant rating before revealing the user's verdict when feasible; label comparisons with already-seen verdicts honestly.
- [x] Resolve attention-threshold disagreements explicitly. Do not optimize for numerical agreement alone or force endless rule changes for individual exceptions.
- [x] Save agreed examples and explain remaining disagreement; require a reason that generalizes before changing a profile rule.
- [x] Add final assembled-profile approval after source and calibration decisions, plus a placeholder/contradiction review.

Acceptance tasks (run as part of the M6 attended rehearsals):

- [ ] Verify an attended fictional-candidate interview preserves supported facts without invented qualifications and explicitly resolves fit 2/3 disagreements, including one-point differences.
- [ ] Verify a geography change revisits dependent decisions without asking again for the CV or unaffected approved answers.

### M4 — Move feasibility early and make installation repeatable

- [x] Check ROOT, runtime, self-check, workbook access and available scheduling/source tools early. Record what was actually tested and in which environment.
- [x] Distinguish validation-only success, installation health and successful scheduled import.
- [x] Ask for timezone and other settings before checks depending on them. Explain first-run workload without claiming a fixed setup duration or unverified cost superiority of models.
- [x] Verify current platform capabilities through owning documentation/tools when implementing; distinguish unavailable actions from user-required manual steps.
- [x] Fill Part A, reject unresolved placeholders, compare Part B exactly and compare installed raw text with the saved file. If installed text cannot be read back, report verification pending.
- [x] Reuse/update the identified task; ensure it targets the actual installation. Confirm schedule and permissions without unnecessarily repeating existing approvals. (Instructions only; unrehearsed on either platform.)

Acceptance tasks (run as part of the M6 attended/platform rehearsals):

- [ ] Verify essential-capability failures are exposed before a long interview, and distinguish unavailable platform actions from manual steps.
- [ ] Verify explicitly accepted LinkedIn fallback permits readiness without claiming direct LinkedIn access or complete coverage.
- [ ] Verify installation/reinstallation on each supported platform targets the actual ROOT, preserves the approved prompt and schedule, and creates no second task for unchanged configuration.

### M5 — Preserve discovery handover and verify readiness

- [x] Retain the existing capture-before-selection rule for discoveries during setup. Link the run in setup state; do not copy its vacancies into that state.
- [x] Keep decisions provisional until applicable profile approval; preserve profile-hash behavior when calibration changes it.
- [x] Distinguish historical calibration material from current actionable vacancies, preserving evidence without inadvertently treating a past application as a new discovery.
- [x] Align setup's run records with current routine requirements, including reading evidence needed to reuse assessments, and mark them `setupDiscovery` so the routine takes them over instead of continuing them.
- [ ] Test the first routine's takeover of pending and assessed setup work in an attended rehearsal.
- [x] Check finish.json/retry, capture-check --open, ledger, source evidence, inventory and importer reports together. Require honest unresolved-work reporting.
- [x] Separate transient source failure from installation failure; do not claim complete coverage for an accepted limitation or pending backlog.

Acceptance: no setup discovery is silently lost; saved assessments are reused when valid; changed-profile decisions are reviewed; an empty successful import verifies empty-batch processing only; scheduled storage evidence and isolated positive-record acceptance remain separate; an incomplete search stays explicitly incomplete.

### M6 — Integrate and rehearse

- [x] Update SETUP_PROMPT.md, CUSTOMIZE.md, affected profile/guides and pristine counterparts together. Keep the roadmap out of installed prompts.
- [x] Update interface/workflow documentation for any actual new paths/helpers; adjust release inclusion/exclusion rules if needed. Do not rebuild ZIPs without an explicit packaging request.
- [x] Preserve setup-log compatibility and verify diagnostics exclude setup-state contents.
- [x] Run focused structural/recovery tests, template drift checks and document/link checks. Avoid testing prompt strings as a substitute for behavior.
- [ ] Conduct isolated fictional-user setup/resume rehearsals with retained evidence; agree model choice and spend cap before paid runs. Verify scheduled behavior on both supported assistant environments before claiming both supported paths work.
- [ ] Run an unaided nontechnical-recipient trial and record friction, repeated questions and unfinished steps.

Acceptance: scenario matrix below passes or has explicit unresolved limitations; no full acceptance claim from fixture tests alone. No runtime personal data in tracked files or release inputs.

## 2. Objective and boundaries

Turn a generic package into a personalized, usable job-search service through an understandable interview and verifiable installation. Setup must survive a pause or a new conversation, preserve approved work, and select its next action from saved facts and prerequisites.

Keep the existing profile, workbook, Part A and routine contracts. Add lightweight setup coordination; do not introduce a database, a general workflow engine, a transcript archive or a second vacancy ledger. The daily routine remains responsible for search execution. Only the importer writes inventory.

Related guidance: [main roadmap](ROADMAP.md), [search orchestration](agent/orchestration/ORCHESTRATION_ROADMAP.md), [interface](INTERFACE_FOR_TRACKER.md), [customization rules](agent/CUSTOMIZE.md). Preserve the search roadmap's capture, recovery and evidence invariants. Record implementation evidence in HISTORY.md and relevant orchestration details in agent/orchestration/ORCHESTRATION_HISTORY.md; keep HANDOFF_AGENT.md current. Update this roadmap for design or sequencing changes, not a session diary.

## 3. Original baseline and problems addressed

Before this implementation, setup persisted a diagnostic setup-log.json, personal artifacts and discoveries in a run ledger, but directed an eleven-step linear walkthrough rather than selecting unfinished work from state. The following findings motivated the changes; they are not claims that every issue remains present in the revised instructions.

- Access and scheduling feasibility are investigated after substantial personalization work.
- Profile approval precedes later changes to calibration and source configuration; no final consistency gate joins them.
- Calibration accepts a one-point disagreement even across the consequential fit 2/3 boundary. Asking for verdicts before an allegedly independent rating also weakens the comparison.
- LinkedIn fallback is allowed in step 8 but an access problem prevents completion in step 11.
- A validation-only import is described too strongly: it establishes neither inventory writes nor scheduled-environment access.
- Resume behavior does not explicitly reconcile existing profiles, employer lists, discovery folders or scheduled tasks before creating/replacing them.
- Final checks do not explicitly include the newer finish.json/retry reconciliation.

Review quality against personalization accuracy, interview effort, calibration validity, artifact consistency, technical feasibility, routine compatibility, recovery, privacy, readiness evidence and maintenance cost.

## 4. State and ownership

### Authoritative artifacts

| Artifact | Responsibility |
|---|---|
| profile/candidate_profile.md | Authoritative personal facts, search rules and approved calibration examples; drafts may be edited only while scheduled and active runs are excluded under the safe-editing contract |
| profile/companies.xlsx | Authoritative employer choices and priorities; preserve existing user content |
| agent/ROUTINE_PROMPT.filled.md | Approved Part A plus an exact copy of current Part B |
| data/reports/setup-state.json | Topic readiness, approvals, unresolved questions, capability evidence and artifact/task references |
| data/reports/setup-log.json | Existing minimal diagnostic record; no personal answers |
| Existing run folders and coverage.json | Vacancy capture, assessment, source coverage and search recovery, under the routine's contract |

The new state file is private runtime data. Do not place it in templates, releases, Git or diagnostic exports. Do not duplicate approved countries, strengths or exclusions in JSON. Store concise unresolved answers only when they cannot yet be placed unambiguously in the profile; clear them after reconciliation. Never store credentials, CV text, mail bodies or conversation transcripts.

### State contract

The exact implemented fields are defined in app/SETUP_WORKFLOW.md. The design requires:

- schemaVersion, setupId and system-clock UTC updatedAt.
- Topics keyed by stable semantic IDs (background, roles, seniority, geography, strengthsGaps, calibration, sources, employers, personalSettings). Use missing, draft, needs_answer, approved or needs_review; absent facts never mean approved.
- Per-topic artifact/section references and approval evidence tied to the content reviewed. Changes to relevant configuration content make affected approval stale. Use semantic topic/section fingerprints; exclude routine-maintained workbook fields as specified below. Do not invalidate unrelated topic approvals or operational evidence merely because file bytes changed. Approval and operational verification are distinct evidence with their own dependencies.
- Pending questions with stable IDs, affected topics and a short question. Distinguish unknown, declined and not applicable; do not convert an unknown into a negative fact.
- Capabilities with untested, verified, failed or unavailable, observedAt, execution context (interactive/scheduled), evidence reference and concise reason.
- Explicitly accepted limitations, their consequences and affected sources. Acceptance must come from the user, never from elapsed time or a tool failure.
- References to setup discovery run folders; installed task ID/platform and prompt fingerprint; latest verification run ID and tested configuration fingerprint.

Derive readiness from this evidence instead of independently maintaining a conflicting overall "done" flag. Keep operational state separate from safe diagnostic output. Saving an artifact precedes marking it approved; if interrupted between writes, reconcile on restart. Write state via a parsed temporary sibling file and atomic replacement. Preserve malformed or unsupported-version state for diagnosis; never silently reset it and overwrite personal artifacts.

## 5. Execution model and dependencies

On every entry, identify ROOT and inspect existing artifacts and any state. Classify fresh setup, continuation or reconfiguration. Missing state in an existing installation is not permission to treat it as blank: reconstruct draft readiness conservatively and ask only where approval or intent is unknown.

Select the next action by prerequisites:

1. Establish basic installation and capability feasibility before a long interview.
2. Extract supported facts from available material; ask short batches about missing decisions.
3. Save the answers and present concise topic-level confirmation.
4. Resolve contradictions and calibrate assessments.
5. Finalize employers, sources and personal settings; approve the assembled configuration.
6. Generate and install the routine, then verify actual scheduled execution.
7. Report personalization, operational readiness and initial-search progress separately.

Independent work may continue around a blocked optional source. A required unanswered question blocks only dependent work. Do not restart all topics after an edit.

| Change | Work that becomes stale |
|---|---|
| Strengths, gaps, mismatch signals or fit definitions | Relevant calibration and profile approval; routine profile-hash reassessment rules still apply; no checkpoint replay |
| §9 special rules or exclusions | Calibration and employer/source suitability; no checkpoint replay |
| Roles, seniority, geography or authorization | Relevant calibration, employer/source suitability, final profile approval and replay of all source checkpoints |
| Source choices | Source configuration, coverage expectations and replay of all source checkpoints |
| Employer rows only | Employer approval and replay of just the added/edited employers; Gmail and portal checkpoints retained |
| ROOT, Gmail label, timezone, summary language or look-back | Filled Part A, installed prompt comparison and affected operational verification; Gmail label and look-back also replay all checkpoints |
| Fixed Part B version | Filled prompt, installed comparison and affected acceptance checks |
| Schedule only | Schedule confirmation and verification; retain profile/calibration |
| Descriptive Name field only | Background/assembled approval and any changed Part A/task comparison; retain scope, calibration and employer/source suitability |

Save at meaningful boundaries (answer batch, approval, artifact change, capability result, task installation, test outcome), not after every tool call. One writer owns setup artifacts. Recovery uses files and observed task state, not the prior chat.

### Review decisions and implementation constraints

- **Protect active configuration:** before changing live artifacts, identify/pause all tasks targeting ROOT with authorization and wait for active executions to finish. Persist editing phase before edits; the new routine guard blocks new runs during editing or stale approval. Legacy installed tasks still require manual/platform coordination. Atomic writes of individual files do not protect the configuration as a whole.
- **Semantic approval fingerprints:** profile topics use section-level content; employer approval excludes row numbering, Last checked and Careers page. Routine bookkeeping does not invalidate approval or scheduled evidence. Calibration additionally depends on the reviewed personal facts/rules. Keep the search routine's existing profile-hash contract.
- **Scope-dependent search recovery:** changes to eligibility, roles or sources may leave uncaptured vacancies behind old checkpoints. Any eligibility, source or search-setting change replays all sources: clear Gmail/portal progress and employer successful dates in both workbook and coverage, preserving inventory/evidence. A change confined to employer rows replays only the added/edited employers. Strengths, gaps, mismatch signals and §9 never trigger replay: capture-before-selection keeps every find and profile-hash reassessment re-rates them. A private write-ahead reset receipt supports interruption/retry. Review the look-back and workload; finer source-specific resets beyond employer rows are deferred until dependencies can be established reliably.
- **Evidence scope:** an empty successful import skips inventory replacement/backups. Require a temporary storage/backup probe in the actual scheduled context, plus isolated positive-record insertion/rendering acceptance; never add fictional personal inventory. Label each piece of evidence by what and where it actually tested.
- **Employer preservation:** revision-checked setup upsert changes only supplied approved fields/additions and retains other rows/content. Removal/renaming requires a reviewed replacement. The routine's restricted update operation stays restricted.
- **Calibration representation:** historical/calibration-only examples and reading evidence stay outside the actionable ledger; current actionable vacancies use its existing states. Do not invent a ledger state or let historical examples become pending work/dropped entries.
- **Accepted limitations reach the routine:** record consent/evidence in setup state and standing consequences in approved profile §10. Explicit no-direct-LinkedIn reading disables that test/reading while retaining employer fallback and optional alerts. Temporary errors do not become permanent exclusions; Gmail remains required.

The helper validates structure/fingerprints and derives readiness; it cannot prove user consent or an asserted scheduled execution context. Retained platform evidence and attended checks remain required.

### Readiness review refinements

All three dependent approvals have an explicit basis: calibration uses calibrationBasis, employers and sources use suitabilityBasis. Return actionable per-topic blockers rather than only needs_review. Keep whole-topic identity approval separate from dependency inputs: the recognized descriptive Name field does not alter search or assessment dependencies; authorization, experience/location/language and unknown prose remain conservative inputs.

Reset recovery is a central activation/search prerequisite even when scope equals lastActiveScope. An unfinished or malformed receipt must block both paths. If configuration was intentionally reverted during an interruption, allow an explicit stopped-search recovery that archives the receipt and replays both stores against the restored scope; never silently dismiss the journal.

Historical scheduled-operation proof and evolving search progress have separate evidence lifetimes. Operational verification depends on the installed prompt, installation and task identity, not on profile wording. Keep verification.runId; tag new search manifests with installation ID and scope fingerprint. Derive progress from matching runs since reset, latest finish/retry, source outcomes across runs, coverage unfinished work and open vacancies. Later successful checks may resolve initial backlog; newer unfinished sources must make progress partial again. Do not infer current scope from a newer filename or complete label. Unclassified legacy evidence remains uncertain until reviewed.

### Second review fixes (2026-11-27)

- Only the latest run must be finished with finish, due and source evidence. Older interrupted or taken-over runs contribute their dated outcomes and due lists where present; coverage `unfinished` and open finds carry their unresolved work, consistent with the orchestration invariants.
- Setup discovery runs carry `setupDiscovery: true` and the setupId and are listed in `discoveryRuns`. The routine takes them over (and, when guarded, any folder without guard identity) instead of continuing them, so a setup-day verification run gets the current installation/scope identity.
- A stopped-search confirmation must be newer than the last saved state; activation clears it.
- Suitability uses background inputs, roles, seniority, geography and §9; calibration additionally uses §5–7. Search scope excludes strengths/gaps/mismatch signals, §9, timezone and language.
- Inspect orders blockers by prerequisite and uses capabilities, limitations and discoveryRuns: verified Gmail gates activation, a standing §10 limitation needs recorded consent, and profile blockers name line numbers while ignoring quoted template guidance.
- The guard skips the search-progress scan; employer fingerprints sort locale-independently; optional state objects are shape-checked; previous-state backups are capped at 50.

## 6. Completion contract

Report three independent outcomes:

| Outcome | Evidence required |
|---|---|
| Personalization ready | Complete and consistent approved profile, employer/source choices, all required Part A settings; no unresolved blocking question |
| Scheduled operation verified | Installed task/prompt match; actual scheduled context accessed required resources, imported successfully and saved reconciled evidence for the tested configuration |
| Initial search complete/partial | Routine finish/retry and source evidence account for every due item and discovered vacancy; remaining work and limitations stated |

Overall setup can be ready with accepted limitations and a recoverable initial backlog, but must never label that backlog complete. Missing required access, wrong ROOT, failed import, stale installed prompt or unverified scheduled execution blocks operational verification. Zero new vacancies is legitimate; a successful empty batch verifies empty-batch processing, not inventory replacement, backup creation or positive-row rendering. Record the separate scheduled storage/backup probe and isolated positive-record insertion/rendering evidence required above. A probe does not establish that a positive import into the live inventory occurred. Never fabricate personal inventory or require a relevant vacancy to exist before setup can finish.

## 7. Verification scenarios

| Scenario | Required observation |
|---|---|
| Fresh fictional installation | Complete artifacts, approvals and operational evidence |
| Pause during interview; resume in new chat | Saved answers reused, unresolved questions remain explicit |
| Existing artifacts without setup state | No destructive reset or inferred blanket approval |
| Artifact saved but state write interrupted | Detect mismatch, reconcile conservatively |
| Malformed state / unknown version | Preserve evidence and personal files; actionable recovery |
| Profile edit after calibration | Only dependent approvals/checks become stale |
| Fit 2 versus 3; known verdict; ambiguous example | Threshold reviewed; independence not falsely claimed |
| Missing optional LinkedIn access | Explicit acceptance and fallback; truthful limited coverage |
| Gmail access missing | Required capability remains blocked |
| Task created before interruption | Existing task recovered; no duplicate |
| Installed prompt drift or wrong folder | Operational readiness fails until corrected |
| Setup discoveries, changed profile, first routine | All finds retained with valid decisions or explicit pending work |
| Empty results / transient site failure / usage interruption | Distinct successful-empty, partial and blocked outcomes |
| Reconfiguration with an existing or legacy running task | No draft or mixed configuration is read; pausing future triggers alone is insufficient |
| Routine workbook date/URL updates | Topic approvals and configuration verification remain current |
| Stale setup workbook edit | Reject changes based on an older revision; preserve unrelated fields and rows |
| Scope expansion and interrupted checkpoint reset | Replay within the reviewed interval; preserve evidence/inventory; resume reset before activating |
| Historical calibration-only example | Never becomes pending work, an import candidate or a dropped entry |
| Accepted source limitation | Approved profile drives the intended fallback; consent alone in setup state has no runtime effect |
| Empty scheduled import | No claim of inventory mutation; storage probe and positive-record evidence identified separately |
| Missing employer/source approval basis | Specific dependency blocker and the exact corrective field; documented approval procedure reaches readiness |
| Interrupted reset followed by scope revert | Activation and guard remain blocked until explicit journal recovery completes |
| Name correction versus authorization edit | Name retains search/assessment dependencies; authorization invalidates them |
| Partial verification then later completed search | Progress advances from matching source evidence while original operational proof is retained |
| Complete verification then later unfinished source work | Progress becomes partial; other-scope/untagged evidence cannot falsely complete it |
| Diagnostics and package audit | No personal setup-state data exposed |
| Strengths or mismatch edit after activation | Calibration review only; suitability, scope and checkpoints unchanged |
| Employer added or edited, nothing else | Only those employers replayed; Gmail and portal checkpoints kept |
| Reconfiguration reusing an old stopped-search confirmation | Editing save rejected until a fresh confirmation |
| Run interrupted on an earlier day, later runs complete | Progress follows dated outcomes; no permanent block from the old folder |
| Verification on setup day with an unfinished setup discovery run | Routine starts a new tagged run and takes the setup finds over |

Measure user question/approval counts, repeated answers, elapsed interaction time, known token/cost usage and manual recovery interventions. Establish a baseline before claiming efficiency gains. Prefer the simplest implementation that passes recovery and correctness scenarios; expand only for demonstrated gaps.

## 8. Next action

The M1 contract is in app/SETUP_WORKFLOW.md and app/setup-state.mjs; M2–M5 helpers/instructions, including the second review fixes, are implemented with focused fixture verification recorded in HISTORY.md. Next conduct isolated attended setup/resume rehearsals, then actual scheduled verification on each supported assistant and the nontechnical-recipient trial. Fixture results do not close those acceptance gates. Agree model/spend cap before paid rehearsals. No live scheduling, commit, push or distribution rebuild is authorized by this document.
