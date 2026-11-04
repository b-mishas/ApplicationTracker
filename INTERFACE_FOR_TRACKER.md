# Interface between the agent and the tracker (for the package maintainer / Codex)

The routine prompt (`agent/ROUTINE_PROMPT.md`, Part B) relies on exactly these points. Keep them stable, or update Part B together with the tracker.

## What the recipient gets (one ZIP, unpacked to e.g. `Documents/JobSearch`)
| Path | Content | Source |
|---|---|---|
| `START_HERE.md` | 5-step overview | agent package |
| `app/` | tracker, importer, schema, starters, bundled runtime | Codex |
| `data/` | empty but valid inventory (`jobs.json`, `incoming/`, `incoming/imported/`, `reports/`, `backups/`) | Codex (or created on first start) |
| `settings/tracker.json` | neutral defaults: no groups, no countries, time zone unset | Codex |
| `profile/candidate_profile.md`, `profile/companies.xlsx`, `profile/cv/README.txt` | blank templates | agent package |
| `agent/SETUP_PROMPT.md`, `agent/ROUTINE_PROMPT.md`, `agent/CUSTOMIZE.md` | setup prompt, routine (Part A placeholders + fixed Part B), customization rules | agent package |
| `guides/` | Claude, Codex, Gmail alerts | agent package |

Not shipped: `HANDOFF.md`, `PORTABILITY.md`, this file, tests, `.git`, any filled profile, CV, `ROUTINE_PROMPT.filled.md`, or data from a real installation. Build from pristine templates, never from a customized folder.

## Release blockers on the tracker side (agent package is ready; these are not)
1. **Groups and countries are still hardcoded** in `app/batch.schema.json` with the original user's values. They must come from `settings/tracker.json`, and the method for changing them (file + field names, or Settings screen) must be documented in `app/SEARCH_WORKFLOW.md`. Setup step 4 stops if no method is documented.
2. **Time zone** is fixed to the original user's zone in the importer; it must come from the settings. Part A's time zone must equal it.
3. **Start and self-check**: a documented way for a non-technical user to start the tracker on Windows and macOS, and to run a self-check.
4. **Node**: either bundled (and the bundled path documented in `SEARCH_WORKFLOW.md`) or a one-click installer link in the README. Claude's scheduled runs execute in a Linux environment; verify Node is available there on macOS too.
5. `SEARCH_WORKFLOW.md` must stop describing settings as "not wired yet" once they are.

## Folder layout (relative to ROOT)
| Path | Owner | Agent access |
|---|---|---|
| `app/` | tracker | read; runs the importer |
| `app/SEARCH_WORKFLOW.md` | tracker | read: import command, settings file and any deadline/urgency fields |
| `app/batch.schema.json` | tracker | read: the agent takes valid groups/countries from here |
| `data/jobs.json` | tracker (importer only) | read |
| `data/incoming/` | agent writes batches | write new batches |
| `data/incoming/imported/` | agent moves completed batches | move only |
| `data/reports/<batch filename>.report.json` | importer | read |
| `data/reports/coverage.json` | agent | read/write (incl. `employers` check dates, the fallback when the workbook cannot be written) |
| `profile/candidate_profile.md` | user | read |
| `profile/companies.xlsx` (sheet "Companies": columns "Careers page", "Priority", "Status", "Last checked") | user; agent writes "Last checked" and "Careers page" when a formatting-preserving library exists | read/write those two columns |

The tracker must not depend on `data/reports/coverage.json` or the workbook; both belong to the agent.

## Import command
From `app/`: `node import-discoveries.mjs incoming/<file>.json --root ../data [--validate-only | --dry-run]`. Exit codes 0 / 2 / 3 / 4 / 5 and the final `RESULT` line as today. The agent follows `SEARCH_WORKFLOW.md` if it documents something else.

Setup self-test relies on two current behaviours; keep them: `--validate-only` writes nothing, and an absolute batch path outside `data/` is accepted.

## Deadlines / urgency
Part B uses deadline/urgency fields only if the installed schema has them and `SEARCH_WORKFLOW.md` describes them; it never overwrites manual urgency. Until then, deadlines go to the summary's Flags.

## No Python dependency
The recipient's computer may have no Python (Windows and macOS ship without a usable one). The agent reads the workbook without installing anything and falls back to `coverage.json` for writes, so nothing in the tracker should require Python either.
