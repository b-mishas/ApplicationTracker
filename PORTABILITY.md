# Portable package contract and remaining work

## Agreed interface

Preserve `app/import-discoveries.mjs`, schemaVersion 1 batch envelope, existing field names, importer flags, exit codes and RESULT line. Preserve user-owned information. Installation-relative `data/` replaces the original user's home-directory path. The employer workbook is `profile/companies.xlsx` and belongs to the agent workflow.

## Target, not yet implemented

- `settings/tracker.json` plus a Settings screen: timezone, groups, countries and export language. Share validation between settings, UI and importer; keep schema/agent instructions synchronized. The settings fields still need a documented schema before Claude depends on them.
- `node app/self-check.mjs`: actionable installation checks, safe temporary write/export probes, zero exit on success. Existing synthetic tests are developer checks, not a substitute.
- A single clean distribution ZIP with compatible bundled Node runtimes, Windows/macOS starters, first-run setup and browser launch. Linux agent environments need Linux Node; host executables cannot run there.
- Replace private Codex spreadsheet runtime dependency and German reference workbook with a redistributable exporter and an empty neutral template. Test export from no applications and synthetic applications.
- Generalize fixed countries/flags, groups/colors/order, timezone and UI copy. Remove source-specific defaults from tests as appropriate.
- Coordinate optional deadline/agent urgency recommendation fields with Claude; keep manual urgency distinct. Until implemented, schema rejects these fields.
- Reconcile INTERFACE_FOR_TRACKER.md and agent instructions with implemented behaviour before release. Do not claim Node setup, settings or self-check exist merely because a prompt expects them.
- Test clean Windows/macOS installations, startup, repeat startup, empty UI, first import, backup/restore and export. Windows checks alone do not establish macOS compatibility.
- Build releases from curated pristine templates, never a customized profile or working data directory. Review external dependency licenses/notices when packaging.

## Origin

Starting source: the existing JobTracker working tree based on commit 2aa2e67, including its uncommitted tracker improvements. The original repository, running server and personal inventory are unchanged. Original personal README/checkpoint/workflow, private export fixtures and temporary maintenance scripts were not copied. Agent files were unpacked from the supplied job-search-agent.zip without changing their contents; the ZIP itself is retained locally and ignored by Git.