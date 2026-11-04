# Interface between the agent and the tracker (for the package maintainer / Codex)

The routine prompt (`agent/ROUTINE_PROMPT.md`, Part B) relies on exactly these points. Keep them stable, or update Part B together with the tracker.

## Folder layout (relative to ROOT)
| Path | Owner | Agent access |
|---|---|---|
| `app/` | tracker | read; runs the importer |
| `app/SEARCH_WORKFLOW.md` | tracker | read: documents the import command, settings file and any deadline/urgency fields |
| `app/batch.schema.json` | tracker | read |
| `data/jobs.json` | tracker (importer only) | read |
| `data/incoming/` | agent writes batches | write new batches |
| `data/incoming/imported/` | agent moves completed batches | move only |
| `data/reports/<batch filename>.report.json` | importer | read |
| `data/reports/coverage.json` | agent | read/write |
| `profile/candidate_profile.md` | user | read |
| `profile/companies.xlsx` (sheet "Companies": columns "Careers page", "Priority", "Status", "Last checked") | user; agent writes "Last checked" and "Careers page" | read/write those two columns |

## Import command
From `app/`: `node import-discoveries.mjs incoming/<file>.json --root ../data [--validate-only]`. Exit codes 0 / 2 / 3 / 4 / 5 and the `RESULT` line as today. The prompt tells the agent to follow `SEARCH_WORKFLOW.md` if it documents something else.

## Settings
Groups, supported country codes and time zone live in the tracker's settings (named in `SEARCH_WORKFLOW.md`). The agent reads them and never hardcodes them. The setup prompt asks the assistant to change them only "through the method the tracker documents" — please document that method (file + field names) in `app/README.md` or `SEARCH_WORKFLOW.md`.

## Deadlines / urgency
Part B uses deadline/urgency fields only if the installed schema has them and `SEARCH_WORKFLOW.md` describes them; it never overwrites manual urgency. Until then, deadlines go to the summary's Flags.

## Assumptions to confirm
1. The tracker ships a self-check the setup assistant can run (e.g. `node check.mjs`), documented in `app/README.md`.
2. Node.js: in Claude, commands run inside the desktop app's Linux environment (Node was available there on the maintainer's Windows machine; verify on macOS). In Codex, Node must be installed on the computer; the tracker README should give a one-click installer link.
3. `data/` starts empty but valid (empty jobs.json, empty `incoming/`, `reports/`, `backups/`).
