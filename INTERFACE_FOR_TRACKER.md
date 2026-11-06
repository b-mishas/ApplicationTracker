# Interface between the agent and the tracker (for the package maintainer / Codex)

The routine prompt (`agent/ROUTINE_PROMPT.md`, Part B) relies on exactly these points. Keep them stable, or update Part B together with the tracker.

## What the recipient gets (one ZIP, unpacked to e.g. `Documents/JobSearch`)
| Path | Content | Source |
|---|---|---|
| `READ ME.html` | Single recipient starting guide and copyable setup instruction | tracker package |
| `app/` | tracker, importer, schema and helpers (starters and runtime/ are at ROOT) | Codex |
| `data/` | empty but valid inventory (`jobs.json`, `incoming/`, `incoming/imported/`, `reports/`, `backups/`) | Codex (or created on first start) |
| `settings/tracker.json` | export preferences only: schemaVersion 1, exportLanguage en | Codex |
| `profile/candidate_profile.md`, `profile/companies.xlsx`, `profile/cv/README.txt` | blank templates | agent package |
| `agent/SETUP_PROMPT.md`, `agent/ROUTINE_PROMPT.md`, `agent/CUSTOMIZE.md` | setup prompt, routine (Part A placeholders + fixed Part B), customization rules | agent package |
| `guides/` | Claude, Codex, Gmail alerts | agent package |

Not shipped: `AGENTS.md`, `CLAUDE.md`, `HANDOFF.md`, `PLAN.md`, `HISTORY.md`, `PORTABILITY.md`, this file, tests, `.git`, any filled profile, CV, `ROUTINE_PROMPT.filled.md`, or data from a real installation. Build from pristine templates, never from a customized folder.

## Implemented tracker interface
- Settings: settings/tracker.json contains schemaVersion, exportLanguage and optional exportName. Use Settings or settings-cli.mjs --check/--apply for export preferences. Profile-defined groups and country codes arrive in position JSON; no search whitelist or tracker timezone is configured. The importer validates recognized country codes independently of settings. Old settings fields are ignored on read and dropped on explicit save.
- Application status and interview/offer milestones belong to the tracker and user. The agent submits discoveries through batch.schema.json. The saved job fields are documented in app/inventory.schema.json and app/SEARCH_WORKFLOW.md.
- Self-check: node app/self-check.mjs from ROOT; no search-configuration prerequisite; legacy --require-configured is a compatibility alias. Exit zero means installation checks passed. Empty-batch validation alone does not establish storage/export health.
- Node: four platform runtimes are bundled by the release builder. Exact paths are documented in app/SEARCH_WORKFLOW.md; Linux agents need Linux Node in their environment.
- Workbook helper: employer-workbook.mjs read/replace/update provides deterministic setup and maintenance without Python; read SEARCH_WORKFLOW.md for input fields and fallback.
- Runtime/package and integration verification: see HANDOFF.md and HISTORY.md in the development repository; they are not distributed. macOS needs a real-machine acceptance check.

## Folder layout (relative to ROOT)
| Path | Owner | Agent access |
|---|---|---|
| `app/` | tracker | read; runs the importer |
| `app/SEARCH_WORKFLOW.md` | tracker | read: import command, settings file and any deadline/urgency fields |
| `app/batch.schema.json` | tracker | read: structural fields; country codes come from app/countries.json, with UK accepted as a GB alias |
| `data/jobs.json` | tracker (importer only) | read |
| `data/incoming/` | agent writes batches | write new batches |
| `data/incoming/imported/` | agent moves completed batches | move only |
| `data/reports/<batch filename without .json>.report.json` | importer | read |
| `data/reports/coverage.json` | agent | read/write (incl. `employers` check dates, the fallback when the workbook cannot be written) |
| `profile/candidate_profile.md` | user | read |
| `profile/companies.xlsx` (sheet "Companies": columns "Careers page", "Priority", "Status", "Last checked") | user; agent writes "Last checked" and "Careers page" using the bundled workbook helper | read/write those two columns |

The tracker must not depend on `data/reports/coverage.json` or the workbook; both belong to the agent.

## Import command
From `app/`: `node import-discoveries.mjs incoming/<file>.json --root ../data [--validate-only | --dry-run]`. Exit codes 0 / 2 / 3 / 4 / 5 and the final `RESULT` line as today. The agent follows `SEARCH_WORKFLOW.md` if it documents something else.

Report filenames strip the final .json; prefer the report path in RESULT. Setup validation relies on two current behaviours; keep them: `--validate-only` writes nothing, and an absolute batch path outside `data/` is accepted.

## Deadlines / urgency
Part B uses deadline/urgency fields only if the installed schema has them and `SEARCH_WORKFLOW.md` describes them; it never overwrites manual urgency. Until then, deadlines go to the summary's Flags.

## No Python dependency
The recipient's computer may have no Python (Windows and macOS ship without a usable one). The agent reads the workbook without installing anything and falls back to `coverage.json` for writes, so nothing in the tracker should require Python either.

Calendar dates use execution-local time. Hosted agents set standard process TZ from their Part A timezone before importing; see SEARCH_WORKFLOW.md. Browser Today uses desktop-local time. Automatic groupColours metadata in jobs.json belongs to the tracker, never the agent.
