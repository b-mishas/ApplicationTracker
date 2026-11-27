# Application tracker — roadmap

The biggest architecture steps, in the order they were or will be taken. [PLAN.md](PLAN.md) holds the concrete to-dos, [HISTORY.md](HISTORY.md) the verified work. When a step is done, add ✅ to its contents line and heading, and write its link as `#<n>--<title>` (the ✅ leaves a double hyphen in the anchor).

## Contents

1. ✅ [Local tracker and import contract](#1--local-tracker-and-import-contract)
2. ✅ [Self-contained package](#2--self-contained-package)
3. ✅ [Search agent package](#3--search-agent-package)
4. ✅ [Cheaper daily routine](#4--cheaper-daily-routine)
5. [State-driven search orchestration](#5-state-driven-search-orchestration)
6. ✅ [Rehearsals with fictional candidates](#6--rehearsals-with-fictional-candidates)
7. ✅ [Use logs and diagnostics](#7--use-logs-and-diagnostics)
8. [State-driven setup](#8-state-driven-setup)
9. [Search quality measurement](#9-search-quality-measurement)
10. [Direct job-board fetching](#10-direct-job-board-fetching)
11. [Shipping to recipients](#11-shipping-to-recipients)
12. [Safe updates and recovery](#12-safe-updates-and-recovery)

## 1. ✅ Local tracker and import contract

A browser tracker that runs on the user's own computer and keeps every position in `data/jobs.json`. Only the importer writes it, through one transactional store with locks and backups, and it accepts only batches that match `app/batch.schema.json`. Groups, countries and dates come from the records, not from settings. Statuses, Excel and PDF exports, and the presets came with it. Done 2026-11-04 to 2026-11-06.

## 2. ✅ Self-contained package

One ZIP per platform (Windows x64, Mac Intel, Mac Apple Silicon), each with a pinned Node runtime, Start, Restart and Stop files, a self-check and START_HERE.html, so a recipient needs no installs. Releases are built only from the pristine templates and audited for private and developer content. Done 2026-11-05 to 2026-11-16.

## 3. ✅ Search agent package

A setup prompt that interviews the user and fills the profile and employer workbook, and a daily routine split into Part A (personal settings) and Part B (a fixed core shared by everyone). Rules for what may change are in `agent/CUSTOMIZE.md`, and the copies in `templates/` are checked against the working files. Written for Claude scheduled tasks and Codex automations; a scheduled run in each is still to be rehearsed (step 11). Done 2026-11-05; refined since.

## 4. ✅ Cheaper daily routine

A completion checklist with explicit states (done, not due, deferred, partial, failed) instead of open-ended effort. Bulk reading goes to the smallest model in full batches, the lead rates from extracts, employer reading methods are cached, and there are rules for filtered reads and grouped tool calls. Done 2026-11-18; small additions since.

## 5. State-driven search orchestration

Keeps every vacancy found from being lost between steps, sessions and interrupted runs, and makes the summary agree with what was actually done. After thirteen milestones of rehearsals, the design is a read-only script, `app/capture-check.mjs`, plus a run ledger the agent keeps itself; a fuller state helper was built, measured and retired. Details: [orchestration roadmap](agent/orchestration/ORCHESTRATION_ROADMAP.md).

**Foundations**
- [x] Run evidence files after the failed rehearsal (run-completion.json, source-evidence.jsonl)
- [x] Durable capture, recovery and derived reporting (milestones 1–3)
- [x] Live measurement of continuous against interrupted runs (milestone 4)

**Simplify on evidence**
- [x] Simplification, small-model acceptance and one slim helper (milestones 5–7)
- [x] Hand-off and recovery, cheaper resume, unannounced interruption and next day (milestones 8–10)
- [x] Break-even helper, three-way comparison, capture check as default (milestones 11–13)

**Harden from reviews**
- [x] Open work across all runs, unknown states, profile hash for re-rating
- [x] Wrong-folder guard, repeats from a second source, identity when a find gains a URL
- [x] Name variants, keyless lines kept apart, all URLs kept for the import check

**Prove in real runs**
- [ ] Watch 2–3 scheduled searches (JobTracker's first): does `--open` agree with Not done, and what does a run cost?
- [ ] Enforce the finish and re-rating rules in code, if runs show the prose is not followed; `finish-run.mjs` now derives the retry list and complete/partial, re-rating still relies on the prose (PLAN.md item 2)
- [ ] Recognise a LinkedIn alert and the employer posting of one job as the same vacancy (PLAN.md item 3)

## 6. ✅ Rehearsals with fictional candidates

Isolated installations with a fictional profile, a frozen answer key and retained evidence under `rehearsal/runs/`. They test the routine on real or fixture sites, including unannounced kills and next-day restarts, and compare variants under fixed rules and a cost cap. They never touch personal data. Done 2026-11-18 to 2026-11-22; reused for every later decision.

## 7. ✅ Use logs and diagnostics

Each run saves its summary and a short `run-log.json` (models, access, checklist states, errors), and setup keeps a per-step `setup-log.json`. `app/diagnostics.mjs` bundles statuses, counts and masked errors into one file that a recipient checks and sends, with no profile, CV, job list or mail content in it. Done 2026-11-23; not yet seen in a real run.

## 8. State-driven setup

Turn the linear setup interview into a resumable process driven by saved prerequisites and approvals. Keep the profile and employer workbook authoritative; add a small private setup-state file for topic readiness, unanswered questions, capability evidence and installed-task references. Preserve approved work across sessions and invalidate only the checks affected by a change.

Separate personalization readiness, verified scheduled operation and initial-search completion. Check feasibility early, strengthen calibration at the fit 2/3 boundary, resolve optional-access limitations consistently, and verify setup discoveries pass safely to the routine. Reconfiguration must pause schedules and wait for active searches; ordinary workbook updates do not invalidate approval. Scope changes, including §7/§9 listing filters, require checkpoint replay (only the changed employers when nothing else changed, with unchanged-source obligations preserved), and empty imports need separate storage evidence. Detailed implementation and acceptance plan: [ROADMAP_SETUP.md](ROADMAP_SETUP.md). State/recovery helpers and revised prompts are implemented; live scheduled and recipient acceptance remain open.

- [x] Define the state, ownership and readiness contracts
- [x] Implement conservative resume, stable source obligations, selective carry-over and evidence-preserving orphan recovery
- [x] Improve interview, calibration and final profile approval
- [x] Verify capabilities early and install schedules repeatably
- [x] Reconcile discovery handover and operational evidence
- [x] Integrate prompts, pristine templates and workflow documentation
- [ ] Rehearse setup, interruptions, scheduled operation and unaided recipient setup

Readiness refinements keep descriptive identity separate from search dependencies, enforce unfinished-reset recovery even after a scope revert, and derive evolving search progress separately from the historical scheduled-operation proof. A second review fixed run takeover, stale stop confirmations, dependency scope and prerequisite ordering. Checked items are implemented with focused regression coverage; live acceptance remains open, so the step is not ✅.

## 9. Search quality measurement

Measure what a run finds against independently checked listings, not only what it reports: the smallest model against the middle one on simple, paginated and JavaScript-heavy career sites, and fixed regression cases that earlier rehearsals missed. This decides which model may read which source. Open (PLAN.md items 4 and 5).

## 10. Direct job-board fetching

A script that reads supported applicant-tracking systems (Greenhouse, Lever, Workday and others) through their public endpoints without a browser, as JobTracker's `fetch-boards.mjs` does. It needs durable pending finds before IDs count as seen, explicit partial status at page limits, and no closure inferred from absence. Deferred (PLAN.md item 6).

## 11. Shipping to recipients

From working package to something a non-technical friend can install alone: a visual check of the guide, a clean extraction on a real Mac, one scheduled search in each supported assistant, and an unaided setup by a recipient. Then publish. Open ([PLAN.md](PLAN.md), Before shipping).

## 12. Safe updates and recovery

Updating a personalised installation to a new package without losing its profile, data or filled Part A; restoring from backups; and signed launchers so operating systems trust the starters. Open (PLAN.md, Later).
