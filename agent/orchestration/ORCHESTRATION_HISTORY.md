# Orchestration implementation history

Detailed, durable record for future development sessions. Newest verified milestone first. Record implementation, rationale, verification and limitations here; amend [ORCHESTRATION_ROADMAP.md](ORCHESTRATION_ROADMAP.md) only when the overall plan changes. Runtime command/field contracts belong in the linked app documentation; checkout status belongs in [HANDOFF_AGENT.md](../../HANDOFF_AGENT.md).

## 2026-11-24 — Codex review of ac8fa4b..2bb2f48, fixes (Claude)

- finish-run: `retry` now takes its `decide` items from `open(root)` (all runs) instead of today's undecided lines, so `searchCoverage` complete means nothing is undelivered, not only that sources were checked. Codex's scenario (no due sources, assessed Title-only fit-4 find, empty inventory) is a regression test.
- Interrupted first runs: mail subagents append `{mailId, jobs}` per finished mail to `mails-<n>.jsonl`; a later run skips only those mails, keeps the original interval and never advances `gmailCheckedThrough` early. A saved job line without its mail line does not count as done (Codex: listed is not extracted).
- Codex follow-up (17:11Z): finish-run labels retry items `import` (assessed, not imported: batch the saved decision, no rerating), `repair` (no state, unknown state, unreadable ledger) or `decide`; test covers import and repair. `gmailInterval` {from, through} is saved in run-completion.json before mails are listed; without a checkpoint the earliest `from` of an earlier unfinished run is kept, so a next-day resume cannot move the lower bound past unfetched mails. `mails-<n>.jsonl` lines carry `announced` and are written after the job lines; short mails need a `mails-reread.jsonl` line before they are skipped. Not covered by an automated test: these are prompt rules.
- run-log.json is written at run start and completed at the end; its subagent list still derives from run-completion.json.
- Not adopted: Codex's claim that conversation copies ignore the model was not added; JobTracker's four-browser-agent allowance stays rejected.

## 2026-11-24 — JobTracker's 23–24 Nov fixes ported (Claude)

- Source: APPLICATIONTRACKER_FIXES.md (JobTracker 4bdba49 to 3d8e7dd). Items 1–2 were already in ac8fa4b. Item 3 ported into capture-check (tenant-scoped job IDs, URL under name variants, hint lines, place words) with JobTracker's variant, shared-board, Alpha and Bayer scenarios; they fail on e182954.
- Items 4–5: the agent no longer writes `dropped` or `refreshed`. `finish-run.mjs` derives the run's books from its folder and writes finish.json; its `retry` list (read back with `--retry-for`) is the objective carry-over, next to the agent's own `unfinished` entries. Adapted: evidence kind `employer` (not `company`), gap searches under `portal`, run from ROOT with `data/` like capture-check. Rationale: JobTracker's 23 Nov run, under equivalent prompt rules, marked unconfirmed refreshes done, credited all additions to Gmail and lost 13 of 77 drops through its own keying.
- Item 7 rules and item 8 (`read-posting.mjs`, no web-fetch summaries as descriptions) are in the routine. Item 9 (board script) not ported: no board script here (PLAN 6).
- Limitations: no agent run with these rules; due.json and the evidence `at` field depend on the agent; legacy plain `refreshed` dates convert on the first finish-run.

## 2026-11-23 — Fix for Codex's P2 on merged URLs (Claude)

- Codex's review of 6412d4c and ac8fa4b found no silent-loss blocker and one P2: a merged entry kept only its newest URL, so a find imported under an older URL without provider ID showed as "assessed, not imported". `open()` now keeps the union of company-qualified IDs and URLs per vacancy and treats an assessed find as delivered when any of them is in jobs.json; name-only merging is unchanged. Codex's other answers need no change (same-run duplicates stay listed by design; shared suffix normalisation is optional cleanup).
- Verified: regression test (two lines sharing a provider ID with different URLs, jobs.json holding only the older URL) fails on ac8fa4b and passes; full npm test exit 0; git diff --check. JobTracker has the same gap (reproduced at b69d46e); reported in its BUGS.md.

## 2026-11-23 — Codex review of 6412d4c and ac8fa4b

- Previous P1 fixed: repeat sources update the canonical ledger line in routine/setup; defensive same-run duplicate rows preserve pending or assessed state. Focused tests cover pending, unimported assessed and imported cases plus a later-run decision. Keyless lines no longer close identified requisitions; word-based similar matching avoids Roche/Rochester.
- Confirmed P2 follow-up at capture-check.mjs merge/final inventory match: two rows sharing provider ID but having old/new URLs merge; only newest URL remains in the assembled find. If inventory has only the old URL and no provider ID, --open incorrectly says assessed, not imported. Reproduced in a temporary fixture. Retain accumulated strong keys/URL aliases for delivery matching without broadening name-only merges. Not a blocker for controlled observation: false open is visible, not silent loss.
- Claude's questions: (1) preserving an open row on same-run duplicate is acceptable under the documented edit-in-place decision contract; clarify that real decisions update the original line. (2) With current slotFor, sequential keyless same-name rows normally merge into one keyless slot, so two do not inherently create an unresolvable backlog; without identifiers the helper cannot distinguish real same-name vacancies. Keep ambiguous rows visible and enrich/edit the original row, not infer identity. (3) URL alias preservation is worth the small follow-up above. (4) Share legal-token normalization later with tests, but do not alter importer's strong identity semantics merely to remove duplication; Co-Diagnostics is a pre-existing normalization issue outside these commits.
- Verification: node app/test-capture-check.mjs, node app/test-templates.mjs and git diff --check passed. Isolated URL probe confirmed false open. No full-suite rerun, live agent run, build, automation or JobTracker writes. Recommendation: accept previous blocker as resolved; controlled ordinary-search observation can proceed after correcting the rehearsal ROOT if using that task. User authorization still governs packaging/automation changes.

## 2026-11-23 — Identity and company-name gaps from JobTracker's review (Claude)

- Codex's review of JobTracker's port found two gaps that also applied here; both confirmed in the code and fixed as JobTracker did.
  1. `slotFor`: a line without ID or URL joined the only earlier entry of its name even when that entry had an ID, so a later keyless exclusion could close an identified pending second requisition. Now it joins only a single keyless entry, otherwise it is its own entry (listed until decided; no merge without an explicit reference). Every merge keeps known identifiers (`{...before?.d, ...found}`). Trade-off: a keyless assessed line for a vacancy already imported under its URL is now listed instead of silently merged; listing is the safe direction. The same-run repeat rule is unchanged.
  2. `sameCompany`: the plain prefix test matched Roche with Rochester. Names now compare by whole words after removing legal suffixes; the shorter name's words must start the longer one's (at least 4 characters).
- Verified: tests for a keyless exclusion next to an identified pending find, a keyless assessed line plus a keyless repeat, and Roche Diagnostics / Rochester Biotech / LabGenius Therapeutics Ltd; the identity test fails on 6412d4c. Full npm test exit 0. No agent run.

## 2026-11-23 — Fix for Codex's repeat finding (Claude)

- P1 confirmed and reproduced (pending find plus a same-URL duplicate line gave `open: none`); introduced in a311937. Fix in two places: the routine and setup add a `repeat`'s source to the find's existing ledger line instead of writing a duplicate line (editing earlier lines now allows this); `open()` keeps the earlier entry's state when a `duplicate` line repeats a vacancy already in the same ledger, filling in an ID or URL it lacked. Same run only, because a later run's duplicate is a real decision (for example a carried find judged the same as a stored record) and must still close the vacancy.
- Verified: tests for pending plus repeat, rated-not-imported plus repeat, imported plus repeat (done), and a later run's duplicate decision (closes); they fail on ee6ec38's script. Full npm test exit 0; prompt and template parity; git diff --check. No agent run.
- Codex's other point (a small model's `text: full` is self-reported) needs observation, not code. JobTracker has the same bug (reproduced with its script at fec635d; its scheduled task runs the affected prompt); reported in JobTracker/BUGS.md without changing JobTracker.

## 2026-11-23 — Codex review of a311937 through ee6ec38

- Reviewed the five implementation commits named in HANDOFF_AGENT: CLI guards/repeat/identity changes, posting extract completeness, template drift test, hard-versus-soft geography, and similar-name variants. Focused capture-check and template tests pass; git diff --check passes. No full suite rerun or agent rehearsal.
- P1 confirmed: repeat occurrences can hide unresolved canonical work. Routine line 98 says record repeat finds as duplicate of the first find. open() merges same strong identity and replaces the prior row with the latest row (capture-check.mjs around 137–140), then duplicate is terminal. Isolated fixture with empty inventory, pending role URL followed by same-URL duplicate occurrence returns open: none. An unimported assessed row is likewise vulnerable. Fix occurrence handling: preserve the canonical vacancy's decision when appending another source, or explicitly follow duplicate references and keep their target open. Add regressions for pending/assessed target plus repeated occurrence, then terminal resolution. No full-helper restoration needed.
- Other reviewed changes look reasonable: broad company prefixes only produce similar, not automatic known; hard geography drops require established facts; partial posting extracts trigger reread, while full duty-only descriptions are valid. A small model's full flag remains self-reported evidence, not independent completeness verification. Template skip paths are bounded to maintainer/private artifacts. No further confirmed blocker found in this review.
- Release remains at 330274f, missing ee6ec38; do not rebuild without request. Installed rehearsal ROOT remains invalid as reported by Claude. No real inventory, JobTracker, automation or implementation modified. Next: fix P1 with focused tests, then ordinary-search observation.

## 2026-11-23 — Capture check fixes from Codex's JobTracker port review (Claude)

- Codex reviewed JobTracker's port (source e13ae54) and listed five bugs in BUGS.md that apply here too. All confirmed by reading the code and fixed, adapting JobTracker's fixes:
  1. Wrong ROOT looked like an empty inventory: the CLI exits 2 without `data/jobs.json`, and `--open` also without the profile (releases ship an empty jobs.json). The routine stops before searching on that error.
  2. The finish check read only today's ledger: the routine runs `--open` for all runs, before closing earlier ones.
  3. `reassess` versus a dropped-list `known`: the routine says `reassess` wins. Wording only.
  4. The same vacancy from two sources was read twice: `--seen <run-ledger.jsonl>` and matching within one call print `repeat`; the routine and setup check before adding finds to the ledger and keep both sources in the batch record. LinkedIn and employer URLs differ, so that pair stays `similar`.
  5. A find gaining an ID or URL became a second vacancy: it joins the one earlier entry of its name without ID or URL; different IDs stay separate. Differences from JobTracker: a later entry without ID or URL joins only an unambiguous earlier entry, and keeps that entry's ID and URL so an imported vacancy is still recognised. The routine allows adding a later-found ID or URL to a ledger line.
- Verified: new scenarios (CLI exit codes, `repeat` against the ledger and within a call, the ID transition next to a same-title second requisition) fail on the previous script and pass; full npm test exit 0; prompt and setup parity; git diff --check. No agent run.

## 2026-11-22 — Capture check fixes after Codex's implementation review (Claude)

- All three findings held. P1 (open finds hidden once a run is finished): `--open` without a file now reads every run's ledger (oldest first by run ID) and keeps the newest entry per vacancy, matched by any shared provider ID or posting URL, else company, title and location; finished runs no longer hide open work, and a find carried into a later run is listed once. The routine runs it at start, before deciding whether to continue today's run; "finished" now only governs that resume. Chose this over Codex's "leave runs unfinished" so status keeps one meaning.
- P2 (unknown states counted as done): states are trimmed and lowercased; only duplicate, excluded under the current profile, or assessed and in jobs.json are done. Anything else is listed as `unknown state`; an unreadable or missing ledger is listed instead of aborting. The routine and setup now name the four allowed states. On milestone 12's plain-ledger evidence the check surfaces an invented state (`uncertain-duplicate`) besides NK-24388.
- P3 (no profile marker): `--open` prints the profile hash (same SHA-256 as run-state's profileRevision, so old manifests and rows compare); the agent saves it as `profile` in run-completion.json (setup: after approval). Decisions of a run with another or no marker are listed as `reassess` unless imported. Shortcut: after a profile change every older exclusion is listed; add a cut-off if that grows long.
- Roadmap amended for the design change (state table, helper paragraph, where details live, invariants, milestone 13, next action).
- Verified: test-capture-check.mjs extended (finished old run with open finds, carried find superseded across runs with an extra ID, unknown and spaced states, profile change, missing marker, unreadable and missing ledgers, CLI without files); full npm test exit 0; prompt parity; git diff --check. No agent run.

## 2026-11-22 — Codex implementation review of capture-check

Judgement: appropriate simplification, but fix three continuity issues before normal use. No implementation changes made.

- P1: ROUTINE_PROMPT.md:235 marks the current run finished even when --open lists unresolved finds (allowed to be reported under Not done). Startup at line 68 scans only unfinished runs. A pending vacancy reported today can therefore be skipped tomorrow. Keep runs with open finds discoverable: leave them unfinished or scan all ledgers for open rows. Close predecessor runs only once all work is durably transferred. Update template too.
- P2: capture-check.mjs:70-72 treats every unknown state as closed. Reproduced with state deferred and assessed followed by a space: both print open: none. Trim/validate states; unknown states must fail visibly or stay open. Only explicit terminal dispositions or assessed rows matched to inventory should count as done. Add focused regressions.
- P2: routine lines 68/83/98 reuse prior assessments under the current profile but no longer save a profile revision/hash or equivalent snapshot reference. A changed profile cannot reliably be distinguished from the one that produced a decision. Add one compact profile marker and invalidate/review stale decisions; old rows without a marker must not silently qualify as current. This does not require restoring full orchestration.

Verified: node app/test-capture-check.mjs passed; isolated temporary-file probes reproduced unknown-state suppression; git diff --check passed. Reviewed matching, old-ledger reader, CLI, tests, prompt/setup/template integration, package test and release file-list changes. Full npm test was reported by Claude, not rerun. No paid rehearsal, packaging or real inventory writes. Matching checks cover company-qualified strong IDs, aliases and same-title distinct vacancies. Remaining agent behavior untested on this version.

## 2026-11-22 — Capture check as default, milestone 13 (Claude)

- Adopted Codex's milestone 12 recommendation. `app/capture-check.mjs` is the rehearsal copy promoted: same matching as run-state 92e1d73 (company plus provider job ID or posting URL, tracking parameters ignored, record `otherIds`/`postingUrls` aliases; same company, title and location gives `similar`), clearer invalid-input messages (file and line), and `--open <ledger>` listing finds pending, without a state, or assessed but not in jobs.json. It reads old run-state ledgers (`discovery` rows) too.
- Routine and setup prompts (source = templates) use arm C's plain-ledger text plus the open check: at start on unfinished earlier ledgers (old folders: manifest `finishedAt`), and before the summary, where every listed find must be decided or reported under Not done. Routine 43.6k → 44.8k characters.
- Removed run-state.mjs, candidate-ledger.mjs, their tests, RUN_STATE.md and CANDIDATE_STATE.md (recoverable from 92e1d73); updated package.json test, build-release file list, INTERFACE_FOR_TRACKER, SEARCH_WORKFLOW, the commit-prefix examples and a line in HANDOFF_WRAPPER.
- Verified: new test-capture-check.mjs (ID, URL with tracking parameters, aliases, dropped list, same-title distinct requisition, other company, unknown location, input shapes, broken JSONL, open check, CLI); full npm test exit 0; prompt parity; git diff --check. On milestone 12 evidence the shipped check prints the same groups as the rehearsal copy, `--open` on the plain-ledger arm's ledger lists exactly NK-24388 and on the capture-only arm's ledger nothing. No agent run on this version.
- Not done: the profile template's missing drop signal for on-site roles outside the preferred location (separate follow-up).

## 2026-11-22 — Codex review of milestone 12

- Reviewed frozen protocol, report, per-arm scoring, failure inspections, fixture profile, current routine and rehearsal capture-check implementation. No agent rerun, full raw-log reconstruction or code test run. Costs include estimated killed-session usage; one run per arm and cache/order effects preclude ranking the 1–5% differences reliably.
- Recommendation: adopt capture-check plus a durable plain ledger as the default; retire full orchestration from the default prompt, not persistent state. Preserve prior run artifacts and compatibility/readability of unfinished work. Do not delete old data or assume the rehearsal-only script is production-ready. Keep full-helper code recoverable in Git; stop expanding synthetic benchmarks to find a justification for it.
- Full helper is now approximately cost-neutral and matched capture-only correctness. Its incremental benefit is unproven, not disproven. Strongest untested case: saved evidence/assessments become the only surviving source because a listing or alert disappears before resumption. Many interrupted runs, profile changes and smaller/weaker leads may increase the value of deterministic bookkeeping, but also its costs. No defensible numeric probability follows from these few related runs.
- Capture-check is a useful small deterministic component (known/similar/new); NK-24388 being highlighted is consistent with preventing the observed omission, but one run does not prove causality. It writes no state and cannot itself guarantee completeness or recovery. Retain batch saves and a finish-time reconciliation: each captured find has an explicit disposition or remains visibly pending; never report nothing unfinished while pending rows exist. Prefer a small deterministic pending-row check over restoring a broad orchestration framework if needed.
- NK-24318 is ambiguous for scoring the architecture. Geography says no relocation, supporting exclusion; explicit mismatch rules omit German on-site roles outside Berlin, while the routine says to put relocation constraints in Gaps. A/C explicitly flagged the issue. Keep the frozen score and literal plain-ledger verdict unchanged as historical evidence, but make a separate engineering recommendation based on policy ambiguity and component relevance. Do not silently rewrite the answer key or assert the state path caused the rating difference. Clarify hard exclusions versus preferences in setup/profile; do not invent the user's policy.
- Next: promote/harden capture-check using focused tests (strong IDs, aliases, same-title distinct requisitions, invalid input), update routine/setup/template/interface references together, preserve saved assessments and unresolved work, and verify final pending reconciliation. Then observe a small number of ordinary searches already due in the actual runtime, retaining compact counts/costs where available. Revisit full-helper components only for observed failures they would prevent. No extra paid rehearsal needed for this decision; no implementation performed by this review. Roadmap unchanged pending adoption.

## 2026-11-22 — Three-arm break-even check, milestone 12 (Claude, fresh session)

- Base 92e1d73 for all arms, one run each, milestone 10's fixture, ground truth, kill point, date shift and models (Sonnet 5.5 lead, Haiku 5.5 subagents):
  - A: the full helper, unchanged.
  - B: plain-ledger prose (milestone 10's B regenerated for the base: `kind`/`status`, rating basis and source counts as prose), helper files removed.
  - C: B, with the duplicate rule replaced by a rehearsal-only `app/capture-check.mjs` (run-state's capture matching; it prints `known`/`similar`/`new` lines and writes nothing). On all 19 fixture openings its grouping equals run-state's.
- Measured:
  - A: 5/5 relevant imported; one inappropriate import (NK-24318, fit 5, relocation noted in Gaps).
  - B: one silent loss. NK-24388 stayed `pending` in its own ledger, was left out of the hand-picked reading batch, and its summary said "Not done: nothing". B dropped NK-24318 correctly.
  - C: same outcome as A (5/5, NK-24318 imported).
  - No duplicate imports, no known vacancies rated, and no unfinished due work in any arm.
- Cost (p1 estimated, p2 billed): A USD 1.10, B 1.09, C 1.05; cache writes 142k/105k/109k tokens.
- Lead context: A 20 turns and 93k characters of tool output; B 23 and 77k; C 20 and 86k. C's lead printed the find files whole alongside capture-check.
- Total spend USD 3.41 of a USD 5 cap, including a USD 0.16 auth check.
- Inspections:
  - B's loss is a state-handling failure. In A and C the capture `similar` line forced a decision on NK-24388.
  - NK-24318 is a rating judgement, outside the state path. The fixture profile says "No relocation", but §7 has no drop signal for on-site roles elsewhere in Germany.
- Verdict:
  - The frozen protocol rule ("loses nothing" = no correctness measure worse than B's) picks the plain ledger, because C has one more inappropriate import.
  - Read as "loses no vacancy", as the brief worded it, the rule picks capture-only: 0 losses against 1, at −3.7%.
  - The full helper is not chosen under either reading: at most 5% dearer than either other arm, and no more correct than C.
  - Left for Codex review.
- Evidence: rehearsal/runs/2026-11-22-three-arm-break-even/ (PROTOCOL.md, evaluation/REPORT.md, comparison.json, streams, native logs, server logs, snapshots, inspections, prompt/app diffs, scripts).

## 2026-11-22 — Unannounced interruption and next-day rehearsal, milestone 10 (Claude)

- Base 7d2529c for both arms, one repetition each:
  - A: the routine with run-state.
  - B: its four run-state paragraphs replaced by plain-ledger prose with the same save points and carry-over rules; helper files and SEARCH_WORKFLOW's "Candidate capture" section removed.
  - Shared: Sonnet 5.5 lead, Haiku 5.5 subagents.
- Fixture on 127.0.0.1:18765, 19 openings:
  - Nordkamm listing paged in two pages, with relevant NK-24415 only on page 2;
  - Veltrum's first listing request returns 503;
  - aliases of StepStone/LinkedIn records, an exact-ID record and a dropped entry;
  - NK-24388 (second requisition, same title), NK-24318 (out of scope);
  - a due Shortlisted refresh.
- Procedure: p1 killed unannounced once the first subagent find file was complete, before the lead used it. Dates were then shifted back one day (synthetic). p2 ran the normal prompt with no note.
- Measured, both arms:
  - 5/5 relevant imported; 0 silent losses, inappropriate imports, duplicate imports or known vacancies rated;
  - all due work finished (both employers checked, refresh done, `unfinished` empty);
  - p1's find file taken in and the old run closed;
  - p1's refresh reading lost with the kill and repeated.
- Cost: A USD 1.17 vs B 1.04 (+12%; p1 estimated from native tokens, p2 billed +17%). Cache read +18%, cache write +25%; uncached input 70 vs 62.
- Excluded attempt: the first arm B found run-state through SEARCH_WORKFLOW.md and ran `init` itself; it was stopped and rebuilt. Total spend USD 2.78 of a USD 5 cap.
- Verdict rule: shrink. The carry-over prevented nothing that the plain arm missed. In this pair the prose duplicate rule matched capture, so the capture script is a fallback, not a demonstrated need. Not tested: a kill after saved ratings, a same-day resume, a listing that changes between sessions, and variance.
- Evidence: rehearsal/runs/2026-11-22-stress-recovery/ (PROTOCOL.md, evaluation/REPORT.md, comparison.json, streams, native logs, server logs, snapshots, prompt/app diffs, scripts).

## 2026-11-22 — Break-even helper, milestone 11 (Claude)

- Cost analysis of milestones 6/8/10 (from CLI per-model usage at Sonnet 5.5 rates, which reproduce billed totals): cache writes are the largest component in both arms (41–49%), then cache reads (26–34%) and output (21–25%); Haiku subagents $0.01–0.03. The helper's extra lead turns fell from 7 (M6) to 2.5 (M8) to 1 (M10); M10's remaining +12% came from tool output entering the lead's context (69k vs 47k characters: full capture listing, the same file printed again, unfiltered extracts, a RUN_STATE.md read) and run-to-run variance.
- `capture` on the command line prints one line per find (`id | company | title | location | url`, `≈ record` for similar, `= decision` for decidedBefore) plus a short note on the groups; the library still returns objects. Finds already decided in the current run are reported as decidedBefore or known instead of being omitted.
- `init` moves open finds of earlier runs into the current run with state and assessment (`carriedIn` in the manifest; earlier entries become duplicates), on new runs and on same-day resumes, without overwriting finds already in the current run. `resolve --run` is no longer needed for carried work.
- `summary` adds `ratedThisRun` (assessed by basis, excluding carried ratings) and `sources` (source-evidence.jsonl per `kind` and `status`); the routine asks for those two fields in each evidence line and takes Postings and source counts from the summary.
- Routine (source = template): no printing of captured files and no RUN_STATE.md read; filtered reads of saved result files; independent lead tool calls in one turn. 42.8k → 43.6k characters.
- Real runs use the Claude desktop scheduled task or a Codex automation, not the CLI; cache lifetime and pricing there are not measured. Reducing what enters the lead's context and the number of lead turns lowers input either way; a daily run also starts with a cold cache, so the fixed prompt is written every run.
- Verified: 10 run-state fixture scenarios (new: ratings and source counts, re-captured and carried finds, carried finds decided without --run); full npm test exit 0; prompt parity. Not verified by an agent run (milestone 12).

## 2026-11-22 — Cheaper resume after milestone 8 review (Claude)

- Cause addressed: in milestone 8 the resumed helper arm started a new run, inspected the old one and rebuilt its batch (16 vs 11.5 lead messages; p2 +46% input), and one resume re-fetched postings it already had.
- `init` now continues the current run when it started today and has no summary (`resumed: true`, same run ID and batch name; its own open finds appear in `carried`). A next-day run still starts a new run and carries open finds.
- Capture and resolve record their input file names in the manifest (`inputs`); `init` and `next` list `uncaptured` .json/.jsonl files in unfinished run folders: subagent find lists left by an interruption, or posting extracts to reuse.
- `summary` ends the run (`finishedAt`) and any earlier unfinished one (`closedBy`), so their files are listed once; open finds stay carried. It still writes no ledger or inventory.
- Routine (source = template): on `resumed`, continue the run; take source attempts from source-evidence.jsonl, continue partial or unstarted sources, retry failures only under the retry rules (an attempt is not a check); capture uncaptured find lists and rate from saved extracts. Codex's point adopted: no blanket same-day no-fetch rule. Routine 42.3k → 42.8k characters.
- Verified: 9 run-state fixture scenarios (new: same-day resume with uncaptured files, summary ending it, next-day listing of an earlier run's file until a summary closes it); earlier scenarios now model next-day runs. Full npm test exit 0; prompt parity. Not verified by an agent run.

## 2026-11-22 — Codex review of milestone 8

- Independently checked final inventories and CLI costs; retained findings support reducing resume overhead, not deleting untested cross-day recovery. Plain r1's out-of-scope import and helper r2's missed refresh prevent describing correctness as fully equal.
- Proposed a matched-base, bounded unexpected-interruption/next-day comparison before removing carry-over, plus reuse of saved evidence without suppressing incomplete work or legitimate retries. No runtime changes or new rehearsals.
- Detailed review: rehearsal/runs/2026-11-21-handoff-recovery/evaluation/CODEX_REVIEW.md; current state in HANDOFF_AGENT.md. Roadmap unchanged pending design decision.

## 2026-11-21 — Hand-off and recovery rehearsal, milestone 8 (Claude)

- Arms: A at 49aac06 (run-state v3) vs B at b66c262 (plain routine and agent-kept ledger). Two repetitions per arm, each in its own installation built from pristine templates by script. Fictional Alex Weber; one fictional employer (Nordkamm Pharma) served on 127.0.0.1:18765 with a request log. 19 openings:
  - 6 known-vacancy traps: two name aliases of StepStone/LinkedIn records, one ID with a tracking-parameter URL, one exact ID/URL, one dropped, one reworded title identified by a stored note;
  - NK-24388, a second requisition with a stored record's company, title and location;
  - 3 other relevant new openings, 2 to read and drop, 7 out of scope.
- Launch as in milestone 6 (Sonnet 5.5 lead, Haiku 5.5 subagents, desktop environment stripped), plus an identical delegation note in both arms (Haiku employer subagent; posting subagents from three postings up). p1 used a prompt-level stop after rating and before the batch, with a kill guard on importer calls that never fired. p2 was a fresh session told only that an earlier session was interrupted. Fixture first used port 8765, the personal tracker's server; it was moved before any run.
- Measured outcomes:
  - Both arms imported 4/4 relevant vacancies, kept NK-24388, made no duplicate imports and changed no stored record.
  - After resume, both reused every saved rating unchanged and re-rated nothing.
  - A rated no known vacancy; B wrote fits for 3 per repetition (name aliases and the reworded title; none imported). Both sent those 3 postings to the reader.
  - A repeated more work after resume: r1 retried a failed refresh; r2 re-fetched the listing twice and 6 postings. B r1 re-fetched the listing once.
  - B-r1 imported one out-of-scope role (Ingelheim on-site).
- Cost (measured): A USD 1.75 vs B 1.52 per repetition (+15%); input 2.35M vs 2.01M (+17%). p1 was about equal (+7% cost, +1% input); p2 cost +26% and used +46% input (16 vs 11.5 lead messages: init/next, inspecting the old run, schema read).
- Summary accuracy (manual check): B complete in both repetitions. A-r1 reported posting and subagent counters as inferred or unknown after resume; A-r2 reported refreshes due 0 although the Grover refresh was due and never attempted.
- Decision rule: shrink. A lost nothing but repeated more work and cost over 10% more. Its one win, no ratings of known vacancies, comes from the capture check. Proposals (not implemented): capture-check-only script; the plain ledger as the record; a resume sentence against re-fetching today's attempted work; an unannounced-kill and next-day-resume test.
- Limits: 2 repetitions, one local board, announced prompt-level stop, Windows 11, CLI 2.1.233.
- Evidence: rehearsal/runs/2026-11-21-handoff-recovery/ (PROTOCOL.md, evaluation/REPORT.md, comparison.json, streams, native logs, server log, snapshots, scripts).

## 2026-11-20 — Slim helper after small-model rehearsal (Claude)

- Milestone 6 showed equal outcomes and 57% more input with helpers, mostly from extra lead turns (helper calls, reading RUN_STATE.md, task updates, reading postings itself). Codex's review (rehearsal evaluation/CODEX_SUGGESTIONS.md) proposed the same direction: one capture-plus-check call, tasks only where work carries over, run ID kept inside ROOT, and a hand-off/interruption rehearsal next.
- `run-state.mjs` v3: `init` (generates the run ID, writes `data/reports/runs/CURRENT`, prints run folder, batch file name and carried finds with saved fit/reasoning), `capture` (takes subagent JSONL as written, saves first, auto-resolves finds sharing a provider ID or URL with any inventory record or dropped entry as duplicate, returns new / known / similar / decidedBefore with 8-character ids), `resolve` (flat decisions, short ids, profile hash added), `summary`, `next`. `--root` defaults to `data`; `--run` only for other runs.
- Removed: task list and `task`/`read` commands, scope/exclusion fields, cross-run task listing. Unfinished source work stays in coverage.json `unfinished`; employer/portal counts come from source-evidence.jsonl.
- Name-only matches are no longer treated as known: same company/title/location without a shared ID or URL is returned as `similar` for the agent to judge, so a new requisition with a reused title is not auto-skipped.
- Routine: command lines inline (no contract reading), one resolve call per rating round, posting reads delegated from three postings up. Routine 41.4k → 42.0k characters.
- Not adopted from Codex: per-company record lists for subagents (the capture check covers it).
- Codex review fixes: (1) delivery needs a shared provider ID or URL; a name match counts only for finds with neither, otherwise the find is carried with `similar`, so a second requisition with a stored title survives an interruption. (2) Rediscovered vacancies get one open entry: a current-profile decision is copied onto today's row and earlier rows become duplicates pointing to this run, so a reused exclusion no longer reappears as pending. (3) `resolve` requires an explicit basis, and evidence for "Posting reviewed"; no defaults upgrade a title-only rating.
- Verified: 8 fixture scenarios (CLI end to end, Codex review cases, known/similar/dropped/other-employer ID, inventory delivery with rejected/ambiguous, repeated import, interruption resume with decidedBefore reuse, profile change, read-only summary, preserved bad ledgers); full npm test. Not verified by an agent run.

## 2026-11-20 — Small-model acceptance rehearsal, milestone 6 (Claude)

- Arms: A at 18a85df (ledger, run-state with `known` check and summary) vs B at b66c262 (direct parent; plain-file ledger written by the agent). Isolated installations built by script from pristine templates; fictional Alex Weber; identical jobs.json (Solaris backend Applied, Dataiku full-stack Dismissed), coverage.json (Solaris SRE dropped) and workbook (Grover, Dataiku, Solaris on Greenhouse, 42 listings, unchanged between before/after answer keys). Gmail, LinkedIn, portals and gap searches excluded as run-only user exclusions.
- Launch: `claude -p --safe-mode` (CLI 2.1.233) with `--model claude-sonnet-5-5`, subagent aliases pinned by ANTHROPIC_DEFAULT_HAIKU_MODEL/SONNET_MODEL to the 5.5 models; desktop-app environment stripped (it broke CLI auth). Every logged message verified as claude-sonnet-5-5 or claude-haiku-5-5. The bare aliases resolve to claude-sonnet-5 and claude-haiku-4-5 in this CLI; a first arm A on Sonnet 5 was stopped and discarded.
- Results: both retained 8/8 relevant postings (same fit-4 import, 7 dropped with reason), 0 trap reads or rating passes, all summary counters exact, no tool errors. A: 17 lead messages, no subagent, 1,089,406 input (34 uncached, 1,005,879 cache read, 83,493 cache write), 14,529 output, 115 s. B: 10 lead messages plus one Haiku extractor, 691,768 input, 24,567 output, 139 s. A/B input 1.57 (lead 1.91).
- Decision rule outcome: cut further (A costs more and wins nothing here). Confounds: one run per arm; A read four postings itself while B delegated; traps matched by exact provider ID, which B's own jobs.json comparison also caught; no interruption or multi-run state, the helpers' intended benefit.
- Observed: both leads wrote the run ID to /tmp outside ROOT; A's PowerShell import step then hard-coded the run ID. No helper failure.
- Evidence: rehearsal/runs/2026-11-21-small-model-acceptance/ (PROTOCOL.md, evaluation/REPORT.md, comparison.json, streams, scoring scripts).

## 2026-11-20 — Known finds and queue cleanup (Claude)

- Run finding daily-0042-y9k4: employer-page finds went to a full rating pass although jobs.json already held them (Applied and Dismissed); only alert candidates had been compared, by an ad hoc script.
- `run-state next` now marks pending candidates of every source that match a jobs.json record of any status (same-company provider ID or URL, else company+title with location) or the coverage.json dropped list (ID/URL only, no location stored) as `known` with record id and status. The routine requires capture plus `next` before opening or rating any find and resolves known ones as duplicate unread; the alert step uses the same check instead of its own script.
- Duplicates no longer resurface after a profile change; only exclusions are reassessed. The routine tells the agent to resolve assessed candidates stored under another name as duplicate and unrepairable or closed ones as excluded.
- Not adopted: giving employer subagents full per-company record lists; the scripted check after capture is cheaper and does not depend on subagent judgment.
- Verified: 7 run-state scenarios (new: stored Applied record matched by provider ID across cities, dropped entry, no resurfacing after profile change); full npm test passed. Not verified by an agent run.

## 2026-11-20 — Simplified state helpers (Claude)

- Removed from run-state: manifest/ledger revision requirements (ledger revision now optional), call budgets, deadline, stop/context/resume, and prepare/import/reconcile/receipt with snapshots and fingerprints. Manifest is schemaVersion 2; version-1 files are warned about and preserved.
- Delivery is read from jobs.json: same-company strong key (provider ID or posting URL), else normalised company+title with a location match. `summary` lists `inventory.addedThisRun` from records whose first source file is this run's batch, so retries cannot distort additions; importer reports give counts and records to repair. Task text fields default to empty; nextAction only for partial/deferred/failed.
- Routine returns to the direct importer, drops receipt/unknown-outcome reporting rules, resolves the four-sections contradiction and removes duplicated summary text. Setup capture uses `run-state init`; the dead line after COPY UNTIL HERE was removed. Routine 43.8k → 41.4k characters.
- Rationale: the rehearsal used ~400–500k input tokens for one posting, and the first init failed on missing empty fields; the removed layers guarded rare cases already covered by the idempotent importer.
- Verified: 6 run-state fixture scenarios and ledger tests pass, including a provider-ID collision with another employer (found and fixed during this work). Not verified by any agent run.

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

- Renamed ROADMAP.md to ORCHESTRATION_ROADMAP.md, preserving its existing content rather than shortening it. Added a link to this history and a compaction note (COMPACTION.md, later deleted as no longer needed).
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

## 2026-11-19 — Run evidence files after the rehearsal (1fbdd54)

- Start of this work, before the name "orchestration" (72a1467, 2026-11-20): the routine fixes after the failed rehearsal added `run-completion.json` (then a checklist of items 1–7) and `source-evidence.jsonl` (one line per checked source). The ledger and coverage.json were older. b66c262 in between (posting access, employer fallbacks) is unrelated to state.

## Next session

Recheck the current checkout and owning code; follow the roadmap's current next action. This record does not authorize committing, pushing, packaging, changing installed automations or launching a live search.
