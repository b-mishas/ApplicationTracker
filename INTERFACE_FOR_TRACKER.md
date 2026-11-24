# Interface between the agent and the tracker (for the package maintainer / Codex)

The routine prompt (`agent/ROUTINE_PROMPT.md`, Part B) relies on exactly these points. Keep them stable, or update Part B together with the tracker.

## What the recipient gets (platform ZIP, unpacked to e.g. `Documents/JobSearch`)
| Path | Content | Source |
|---|---|---|
| `START_HERE.html` | Single recipient starting guide and copyable setup instruction | tracker package |
| `app/` | tracker, importer, schema and helpers (starters and runtime/ are at ROOT) | Codex |
| `data/` | empty but valid inventory (`jobs.json`, `incoming/`, `incoming/imported/`, `reports/`, `backups/`) | Codex (or created on first start) |
| `settings/tracker.json` | export preferences only: schemaVersion 1, exportLanguage en | Codex |
| `profile/candidate_profile.md`, `profile/companies.xlsx`, `profile/cv/README.txt` | blank templates | agent package |
| `agent/SETUP_PROMPT.md`, `agent/ROUTINE_PROMPT.md`, `agent/CUSTOMIZE.md` | setup prompt, routine (Part A placeholders + fixed Part B), customization rules | agent package |
| `guides/` | Claude, Codex, Gmail alerts | agent package |

Not shipped: `AGENTS.md`, `CLAUDE.md`, `HANDOFF_AGENT.md`, `HANDOFF_WRAPPER.md`, `PLAN.md`, `HISTORY.md`, `PORTABILITY.md`, this file, tests, `.git`, any filled profile, CV, `ROUTINE_PROMPT.filled.md`, or data from a real installation. Build from pristine templates, never from a customized folder.

## Implemented tracker interface
- Settings: settings/tracker.json contains schemaVersion, exportLanguage and optional exportName. Use Settings or settings-cli.mjs --check/--apply for export preferences. Profile-defined groups and country codes arrive in position JSON; no search whitelist or tracker timezone is configured. The importer validates recognized country codes independently of settings. Old settings fields are ignored on read and dropped on explicit save.
- Application status and interview/offer milestones belong to the tracker and user. The agent submits discoveries through batch.schema.json. The saved job fields are documented in app/inventory.schema.json and app/SEARCH_WORKFLOW.md.
- Current status is authoritative; interview outcome buttons change that status. Legacy interviewOutcome fields are normalized on ordinary saves. Statistics use valid date OR current status: application date or Applied/Interview/Offer; interview date or Interview; offer date or Offer. Dated milestones remain counted after later outcomes. Empty modern dates suppress legacy date fallback, but not current-stage membership. New/Shortlisted/Applied clear interview and offer dates; Interview clears the offer date. Offer/Rejected/Withdrawn/Dismissed preserve the interview date; Rejected/Withdrawn/Dismissed preserve the offer date. Entering Applied/Offer/Rejected/Withdrawn defaults its date to today; Interview leaves an unknown date blank. Same-status edits do not reapply defaults. Discovery batches cannot edit these user-owned fields.
- Self-check: node app/self-check.mjs from ROOT; no search-configuration prerequisite; legacy --require-configured is a compatibility alias. Exit zero means installation checks passed. Empty-batch validation alone does not establish storage/export health.
- Local startup: Start reuses a fixed local address; Restart restarts explicitly. Optional startup at login is controlled in tracker Settings and registered per-user on the computer, independently of agent scheduling. Advanced Settings exposes the local port/address; port changes apply on explicit Restart, which checks availability before stopping. Start/Restart files offer port-conflict recovery. These local preferences are not part of settings/tracker.json or the position database.
- Node: each platform ZIP contains one runtime; the default build targets Windows x64 and Mac Intel. Exact paths are documented in app/SEARCH_WORKFLOW.md and repeated in Part B §1; Linux agents need Linux Node in their environment.
- Workbook helper: employer-workbook.mjs read/replace/update provides deterministic setup and maintenance without Python; setup reads SEARCH_WORKFLOW.md for input fields and fallback; Part B carries the `read` and `update` commands it uses.
- Runtime/package and integration verification: see HANDOFF_WRAPPER.md and HISTORY.md in the development repository; they are not distributed. macOS needs a real-machine acceptance check.

## Folder layout (relative to ROOT)
| Path | Owner | Agent access |
|---|---|---|
| `app/` | tracker | read; runs the importer |
| `app/SEARCH_WORKFLOW.md` | tracker | setup reads it; the daily routine does not, since Part B carries the import, TZ, Node and workbook commands. Change both together |
| `app/batch.schema.json` | tracker | read: structural fields; country codes come from app/countries.json, with UK accepted as a GB alias |
| `data/jobs.json` | tracker (importer only) | read |
| `data/incoming/` | agent writes batches | write new batches |
| `data/incoming/imported/` | agent moves completed batches | move only |
| `data/reports/<batch filename without .json>.report.json` | importer | read |
| `data/reports/runs/<run-id>/` | agent | create a unique folder per run; read/write completion checklist, candidate ledger, source evidence, helper scripts and delegated results; retain evidence for review (setup validation batches use a unique `setupcheck-<unique-id>/` folder here) |
| `data/reports/coverage.json` | agent | read/write (incl. `employers` check and attempt dates, career URLs and cached reading methods, the fallback when the workbook cannot be written; `refreshed`, last refresh attempt and confirmation per Shortlisted record, and `dropped`, the 60-day memory of dropped roles, both written only by `app/finish-run.mjs`; portal `progress` in `sources`; `recheck`, attempt counts for unverified records; `linkedinAccess`) |
| `profile/candidate_profile.md` | user | read |
| `profile/companies.xlsx` (sheet "Companies": columns "Careers page", "Priority", "Status", "Last checked") | user; agent writes "Last checked" and "Careers page" using the bundled workbook helper | read/write those two columns |

The tracker must not depend on `data/reports/coverage.json` or the workbook; both belong to the agent.

## Candidate capture helper

`app/capture-check.mjs` labels the agent's finds as known (same company and a shared provider job ID or posting URL, or the identical posting URL under a variant of the company name, with a jobs.json record of any status or a coverage.json dropped entry), repeat (shares one with a find in the `--seen` run ledger or earlier in the same call), similar (same company and title, allowing extra trailing words in a company name (whole words, at least 4 characters) or a title ending in its city, and overlapping (substring or shared city name, local spellings unified) or missing location, against jobs.json, dropped entries or the run; or a shared URL or job ID under another company label, as a hint) or new, and with `--open` prints the profile hash and lists finds of all run ledgers (or the named ones) whose newest entry still needs work: pending, rated but not imported, decided under another profile, or in an unknown state; a duplicate line repeating a vacancy already in the same ledger does not close it. It reads jobs.json, coverage.json, the profile and run folders and writes nothing; it exits 2 without jobs.json (and, for `--open`, without the profile) so a wrong ROOT is not taken for an empty inventory. The agent keeps its own run ledger and run-completion.json under data/reports/runs/ (agent/ROUTINE_PROMPT.md), independent of inventory and coverage schemas. The earlier run-state helper was retired after roadmap milestone 12 and remains in commit 92e1d73; its run folders stay readable. `app/finish-run.mjs <run-id>` ends a run: it reads the run folder (ledger, `read-*`, `links-*`, `refresh-*`, `evidence-*` files, source-evidence.jsonl, due.json), writes `finish.json` there and rewrites coverage.json `refreshed` and `dropped`; it never writes jobs.json. Imports still use the import command below. Run folders are kept, not deleted by age.

## Import command
From `app/`: `node import-discoveries.mjs incoming/<file>.json --root ../data [--validate-only | --dry-run]`. Exit codes 0 / 2 / 3 / 4 / 5 and the final `RESULT` line as today. Part B carries this command; change it there together.

Report filenames strip the final .json; prefer the report path in RESULT. Setup validation relies on two current behaviours; keep them: `--validate-only` writes nothing, and an absolute batch path outside `data/` is accepted.

## Deadlines / urgency
The batch has no deadline/urgency fields; Part B reports deadlines in the summary's Flags. Adding such fields needs a Part B change.

## No Python dependency
The recipient's computer may have no Python (Windows and macOS ship without a usable one). The agent reads the workbook without installing anything and falls back to `coverage.json` for writes, so nothing in the tracker should require Python either.

Calendar dates use execution-local time. Hosted agents set standard process TZ from their Part A timezone before importing (Part B §9; details in SEARCH_WORKFLOW.md). Browser Today uses desktop-local time. Automatic groupColours metadata in jobs.json belongs to the tracker, never the agent.
