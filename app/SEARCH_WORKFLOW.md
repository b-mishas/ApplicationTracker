# Discovery import contract

## Paths and ownership

All paths are relative to the installation ROOT. app/ holds code; data/ holds jobs.json, incoming/, incoming/imported/, reports/, backups/, exports/ and logs/. The employer workbook is profile/companies.xlsx. The tracker does not read coverage.json or the employer list during normal display. Agents never edit jobs.json; the importer is its only discovery writer. Runtime data and personalized files stay outside Git.

Default data is installation-relative. JOBTRACKER_DATA_DIR and importer --root select another actual data folder. JOBTRACKER_SETTINGS_FILE overrides the default installation-relative settings/tracker.json; changing --root alone does not select different settings. In mounted environments, use real mounted paths rather than Windows paths.

## Settings and record labels

settings/tracker.json contains only export preferences:

    {"schemaVersion":1,"exportLanguage":"en"}

exportLanguage is en or de. Optional exportName is a single-line name of up to 100 characters. The Name field in Settings adds it to the report title in both formats, for example Applications - Name Surname. Clearing the field removes exportName. Defaults are valid immediately; no tracker personalization is required before importing. Older settings files containing groups, countries or timezone are accepted; those retired fields are ignored and removed on the next explicit settings save, with a backup.

The candidate profile owns target role families and geography. The agent assigns each job's group and countries; the tracker derives filter options from existing records. A group is a string of at most 100 characters. Countries must be recognized uppercase two-letter codes in app/countries.json; UK is also accepted as an alias for GB. Unknown codes are rejected without changing the inventory. Existing records remain displayable, including legacy unknown codes shown as text without a broken flag. Flags are bundled locally for every supported code, independently of the countries currently present.

Group colours are assigned automatically. The first four pastel hues match the original palette; later colours maximize perceptual separation in Oklab while keeping the same saturation/lightness. Automatic groupColours metadata is retained in jobs.json on normal writes so new, reordered or removed groups do not reshuffle existing assignments. It is not a search-setting list, and agents must not edit it. Fit remains coloured; no colour-mode setting is needed.

Users choose Excel language through Settings. For a proposed export preference, agents may use:

    node app/settings-cli.mjs --check ABSOLUTE_TEMP_FILE
    node app/settings-cli.mjs --apply ABSOLUTE_TEMP_FILE

--check validates; --apply validates, backs up previous settings and atomically saves. Without flags the command prints current preferences. Never edit code or batch.schema.json to personalize. Search criteria belong only in the profile.

batch.schema.json describes structural types and evidence rules. The importer accepts new profile-assigned groups and recognized countries without a settings whitelist or readiness gate. It does not need settings/tracker.json to import. Empty group/countries remain valid for genuinely unspecified data; preserve advertised geography in locationRaw/workModeRaw.

The settings and workbook helpers accept UTF-8 JSON with or without a byte order mark (BOM). In Windows PowerShell 5.1, select UTF-8 explicitly with Out-File -Encoding utf8.

## Dates — automatic local time

Instants use UTC timestamps ending Z. The importer converts observedAt to firstSeen/lastSeen using its execution computer's local timezone; the browser uses its computer's local date for suggested application and status dates. There is no tracker timezone setting. Previously saved date-only fields are not reinterpreted.

A scheduled agent running on another host must run the importer with standard process environment variable TZ set to Part A's IANA timezone (for example Europe/Berlin), then verify the execution timezone. This configures that import process, not tracker settings. On a local desktop with the same timezone, no override is needed. This avoids calendar-day differences around midnight. Never rewrite date-only records to compensate for a mismatched environment.

Git Bash on Windows can drop TZ when it launches Windows Node. When a timezone override is required, use PowerShell and set the variable in the same session that verifies the timezone and runs the importer:

    $env:TZ = 'Europe/Berlin'
    node -p 'Intl.DateTimeFormat().resolvedOptions().timeZone'

Use the same Node executable for the check and the import. Replace Europe/Berlin with the Part A timezone. Proceed after Node reports the intended timezone (or its canonical IANA equivalent).

## Node and installation self-check

Use Node 22 or newer in the actual execution environment. The Windows x64 package bundles runtime/win-x64/node.exe; the Mac Intel package bundles runtime/darwin-x64/node and the Mac Apple silicon package runtime/darwin-arm64/node (relative to ROOT). Use the executable matching the installed package. A Windows ARM64 package is not built by default. Linux scheduled-agent environments must verify their own Linux Node with node --version; never attempt a Windows/Mac executable there. Do not install software during scheduled searches.

From ROOT run node app/self-check.mjs. The legacy --require-configured option is accepted for compatibility and adds no search-configuration requirement. It checks schema, settings, valid inventory, required folders, writes/backups in a temporary data subfolder, Excel export/readback and the employer workbook. Temporary files are removed; actual jobs are not changed. Exit 0 means checks passed, exit 1 means setup needs attention. This is the installation test. An empty-batch --validate-only test checks batch parsing, not inventory access, saving or export.

## Discovery commands

From app/:

    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --validate-only
    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --dry-run
    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data

Relative batch paths resolve within --root, not app/. Absolute batch paths outside data/ are accepted. Validation and import are separate calls; validation exit 5 must not prevent importing valid siblings. --validate-only does not write any file, including on failure. --dry-run previews a merge without changing jobs but may create failure diagnostics. The default call imports accepted records, sharing lock/revision/backup/atomic replacement with UI saves. Never remove a lock while writers may be running.

Exit codes: 0 processed (check ambiguous count); 2 invalid envelope/all rejected; 3 lock/conflict; 4 write failure; 5 partial success. Every call prints a final RESULT JSON line. Success report for batch 2026-11-05-example.json is reports/2026-11-05-example.report.json: remove the final .json before adding .report.json. Prefer the report path returned by RESULT. Failure diagnostics use a separate .failed-<timestamp>.report.json name. Normalize path separators in mounted environments. Inspect unresolved outcomes before archiving; report-writing failure is not a successful archive condition.

Filename runId must match the envelope. Every sources[].file equals the batch filename. Use UTC Z timestamps for instants; calendar dates/firstSeen follow the importer process local time as documented above. User-owned status, notes, IDs, firstSeen, manual urgency and application information are preserved. Absence from a search never closes a job. Deadline/agent urgency fields are not implemented; report deadlines in summary Flags without adding unsupported fields or overwriting manual urgency.

## Employer workbook helper — no Python

From ROOT:

    node app/employer-workbook.mjs read
    node app/employer-workbook.mjs replace --input ABSOLUTE_TEMP_FILE
    node app/employer-workbook.mjs update --input ABSOLUTE_TEMP_FILE

--file PATH optionally selects a workbook; default is profile/companies.xlsx. Input is a JSON array whose keys are the exact Companies-sheet headings. replace is for approved initial setup and clears old employer values without rebuilding sheets/styles. Example: [{"Company":"Example employer","Group":"Design","Priority":"A","Careers page":"","Last checked":""}]. update accepts only Company (exact existing name), Careers page and Last checked (YYYY-MM-DD or empty), protecting Status and other user information. Both create profile/backups/ before atomic replacement and check concurrent edits. Do not replace or write a workbook open in Excel. The helper preserves this package's ordinary template formatting; it is not a general fidelity promise for arbitrary complex/macro workbooks.

If the workbook cannot be updated, record employer check dates/career URLs in data/reports/coverage.json and report the fallback. The agent owns that file.

## Candidate capture

The agent keeps its own run ledger under data/reports/runs/ (agent/ROUTINE_PROMPT.md). `node app/capture-check.mjs [--seen <run-ledger.jsonl>] <file> [...]` marks finds already in jobs.json or on the dropped list, repeats of finds already in the run ledger, and name-only matches against either as `similar`, before they are read; `--open [<run-ledger.jsonl>]` lists finds of all runs (or the named ledger) still pending, rated but not imported, or decided under another profile. It writes nothing, never writes jobs.json and exits 2 when jobs.json (or, for `--open`, the profile) is missing. Imports use the commands above; rerunning an interrupted import is safe. Run folders are kept. Each run also saves `summary.md` and `run-log.json` (assistant, models, access, checklist status, subagents, errors), and setup keeps `data/reports/setup-log.json`; `node app/diagnostics.mjs [--runs N]` writes `data/exports/diagnostics-<UTC>.json` from them with statuses, counts and masked error messages only, for the user to send.

## Agent search coverage

`data/reports/coverage.json` is the agent's run-to-run search record, not tracker configuration or an import batch. Neither the tracker nor the importer reads it. Fields missing from an older file mean empty. Follow `agent/ROUTINE_PROMPT.md` Part B for its exact JSON structure and completion rules.

- `updatedAt`, `gmailCheckedThrough`, `gmailLastAttempt` and `sources` record attempts and successful coverage. Preserve earlier successful checkpoints for failed, skipped or partial scans; counts describe the current attempt.
- `employers` records, under the exact workbook company name, `lastChecked` (complete successful checks only, including when workbook writes are unavailable), `lastAttempt` (every attempt), `careersUrl` and `method`: one short line describing how the full listing was read (ATS or site, public search/API URL, filters, paging, end of list), reused by the next run. It holds no code or credentials.
- `linkedinAccess` is an object with `attemptedAt` (UTC Z), `browser`, `status` (`ok`, `failed` or `skipped`), `postingsRead`, `postingsFailed` and `reason`. It records the observed browser-access result for the run. Excluded tests use skipped, attemptedAt null, zero read/failed counts and the exclusion reason.
- `dropped` is an array of candidates dropped by the agent that are not in jobs.json. Each entry has `provider`, `providerJobId`, `url`, `company`, `title`, `reason` and `droppedAt` (YYYY-MM-DD). Keep existing entries and remove only those older than 60 days. This memory is separate from the user's Dismissed status in the tracker.
- `recheck` is an array counting re-check attempts for saved "Title only" or Unverified records. Each entry has `jobId`, `attempts` and `lastAttempt` (YYYY-MM-DD). Remove an entry when its record is resolved or no longer New/Shortlisted; stop re-checking after three attempts.
- `refreshed` maps a Shortlisted record id to the date (YYYY-MM-DD) of its last successful refresh. Remove an entry when the record is no longer Shortlisted.
- `unfinished` holds work that failed with an observed tool error or was left partial or deferred by a limit of the routine, each with its reason; remove an entry only after completing it. Standing user rules belong in the candidate profile.

The agent writes this file directly; do not submit these fields to the discovery importer or add them to jobs.json.

## Application exports

The saved inventory has one current status and optional interviewDate, interviewOutcomeDate and offerDate fields. Dates use YYYY-MM-DD. Interview outcome buttons (Rejected, Offer, Withdrawn) change the main status through the same autosave and Undo flow as other shortcuts. Older interviewOutcome fields remain readable for compatibility and are folded into the main status on the next ordinary save; new saves do not store a separate outcome. Rejected and Withdrawn use interviewOutcomeDate; Offer uses offerDate. statusDate is an optional API input for the transition date, not an additional saved field.

Statistics use date OR current status: Applications sent includes a valid application date or Applied/Interview/Offer; Interview invites includes a valid interview date or Interview; Offers received includes a valid offer date or Offer, including dated offers later withdrawn. Dates retained in legacy history are used only when the corresponding modern field is absent. An explicit empty date suppresses that date fallback but does not negate a qualifying current status. Rejected/Withdrawn alone do not establish earlier milestones. Moving back to New, Shortlisted or Applied clears later milestones; returning to Interview clears the offer date. Clearing a date alone preserves the current status. Interview dates persist when moving to Offer, Rejected, Withdrawn or Dismissed; offer dates persist when moving to Rejected, Withdrawn or Dismissed. On actual status changes, Applied, Offer, Rejected and Withdrawn default their respective date to today (or the supplied API transition date); Interview never defaults its date to today. Existing interview dates are retained unless the destination clears them. Explicit date edits override defaults, and same-status saves preserve intentional empty dates. These fields are user-owned and cannot be submitted in discovery batches.

In the browser's Export applications as box, Excel downloads applications.xlsx using only saved jobs.json. A blank inventory exports a valid header-only workbook. Included records have an applicationDate or an effective stage of Applied, Interview, Offer, Rejected or Withdrawn. Every included record needs its actual application date. Rows sort oldest first. For an interview with an outcome, Status shows a dated sequence such as Interview 05.11.2026 -> Rejected 12.11.2026. The editor prefills Application status text with the generated milestone sequence. Optional applicationStatusText stores the complete manual replacement for generated wording in the editor and exports, including an intentional empty string. Notes-only saves preserve it. Stage/date changes regenerate defaults unless the save supplies an explicit replacement; date edits preview the new generated wording. Titles/company/location are not translated. Excel strings remain literal even when starting with '='.

The PDF button opens a printable report in a new tab. Choose Save as PDF in the browser's print dialog. The report uses A4 landscape and shares the Excel export's saved rows, language, date validation and status history. The Print / Save as PDF button in the report reopens the dialog.

    node app/export-applications.mjs --output PATH

Run that from ROOT; --root DIR selects inventory. Existing output files are not overwritten. No private formatting template or LLM runtime is needed. Bundled ExcelJS provides a neutral formatted sheet with frozen header, filter, column widths and print settings. Export language comes from settings.

## Local startup

The `Start` file reuses this installation’s running server. The `Restart` file explicitly restarts it; the `Stop` file shuts it down. The default bookmarkable address is http://127.0.0.1:8765. `node app/launch.mjs --port 8766` selects and saves another fixed port in data/server-port.json; use `--restart --port 8766` if already running. JOBTRACKER_PORT overrides the saved port and is saved after successful startup. Occupied ports are reported without random fallback.

The tracker Settings checkbox Start server at login installs/removes a per-user Windows Startup shortcut or macOS LaunchAgent for this folder. It is off by default, starts without opening a browser, and applies from the next login. It is independent of agent scheduling and is not stored in exported JSON or portable export preferences. Disable it before moving/deleting the folder; enable it again after moving. `--background` suppresses browser opening; `--foreground` keeps the launcher attached for macOS login supervision.

Settings → Advanced exposes Local port and the current Local address through /api/port-settings. A revision-protected save validates availability and stages data/server-port.json without restarting; Start reuses the existing server while the new value is pending. Restart probes the new port before stopping, with recovery to the previous address if a late startup failure occurs. JOBTRACKER_PORT overrides disable the field. Export settings and the position schema are unchanged. The Start/Restart files use --interactive to offer a replacement port or cancellation when blocked; automatic login/--background launches never prompt.
