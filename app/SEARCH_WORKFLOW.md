# Discovery import contract

## Paths and ownership

All paths are relative to the installation ROOT. app/ holds code; data/ holds jobs.json, incoming/, incoming/imported/, reports/, backups/, exports/ and logs/. The employer workbook is profile/companies.xlsx. The tracker does not read coverage.json or the employer list during normal display. Agents never edit jobs.json; the importer is its only discovery writer. Runtime data and personalized files stay outside Git.

Default data is installation-relative. JOBTRACKER_DATA_DIR and importer --root select another actual data folder. JOBTRACKER_SETTINGS_FILE overrides the default installation-relative settings/tracker.json; changing --root alone does not select different settings. In mounted environments, use real mounted paths rather than Windows paths.

## Settings — implemented

settings/tracker.json contains:

    {"schemaVersion":1,"groups":[],"countries":[],"timezone":"","exportLanguage":"en"}

Groups are unique nonempty strings (their order controls the group-filter order). Countries are unique uppercase two-letter codes in app/countries.json; GB is preferred for the UK, and legacy UK is accepted when explicitly configured. timezone is an IANA name; exportLanguage is en or de. Neutral defaults deliberately require personalization.

Users edit these through Settings in the header. Agents should write a proposed complete settings object to a temporary JSON file, then from ROOT run:

    node app/settings-cli.mjs --check ABSOLUTE_TEMP_FILE
    node app/settings-cli.mjs --apply ABSOLUTE_TEMP_FILE
    node app/self-check.mjs --require-configured

--check only validates; --apply validates, backs up previous settings and atomically saves. Without flags the settings command prints current settings and readiness. Never edit code or batch.schema.json to personalize. Reload the tracker after an agent-side settings change. Changing settings keeps existing records intact; older records remain displayable even when their group/country is no longer selected for new searches.

batch.schema.json describes structural types and evidence rules. Groups/countries are intentionally not static enums: the importer ALSO checks them against the current settings. Read both files. Nonempty discovery batches require configured groups, countries and timezone; an empty batch is allowed before personalization. Empty group and countries are allowed for genuinely unspecified/unclassified discoveries; preserve advertised geography in locationRaw/workModeRaw.

## Node and installation self-check

Use Node 22 or newer in the actual execution environment. Host runtimes bundled with the release are runtime/win-x64/node.exe, runtime/win-arm64/node.exe, runtime/darwin-x64/node and runtime/darwin-arm64/node (relative to ROOT). Use the executable matching that OS and processor. Linux scheduled-agent environments must verify their own Linux Node with node --version; never attempt a Windows/Mac executable there. Do not install software during scheduled searches.

From ROOT run node app/self-check.mjs, adding --require-configured after personalization. It checks schema, settings, valid inventory, required folders, writes/backups in a temporary data subfolder, Excel export/readback and the employer workbook. Temporary files are removed; actual jobs are not changed. Exit 0 means checks passed, exit 1 means setup needs attention. This is the installation test. An empty-batch --validate-only test checks batch parsing, not inventory access, saving or export.

## Discovery commands

From app/:

    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --validate-only
    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --dry-run
    node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data

Relative batch paths resolve within --root, not app/. Absolute batch paths outside data/ are accepted. Validation and import are separate calls; validation exit 5 must not prevent importing valid siblings. --validate-only does not write any file, including on failure. --dry-run previews a merge without changing jobs but may create failure diagnostics. The default call imports accepted records, sharing lock/revision/backup/atomic replacement with UI saves. Never remove a lock while writers may be running.

Exit codes: 0 processed (check ambiguous count); 2 invalid envelope/all rejected; 3 lock/conflict; 4 write failure; 5 partial success. Every call prints a final RESULT JSON line. Success report for batch 2026-11-05-example.json is reports/2026-11-05-example.report.json: remove the final .json before adding .report.json. Prefer the report path returned by RESULT. Failure diagnostics use a separate .failed-<timestamp>.report.json name. Normalize path separators in mounted environments. Inspect unresolved outcomes before archiving; report-writing failure is not a successful archive condition.

Filename runId must match the envelope. Every sources[].file equals the batch filename. Use UTC Z timestamps for instants and the configured timezone for calendar dates/firstSeen. User-owned status, notes, IDs, firstSeen, manual urgency and application information are preserved. Absence from a search never closes a job. Deadline/agent urgency fields are not implemented; report deadlines in summary Flags without adding unsupported fields or overwriting manual urgency.

## Employer workbook helper — no Python

From ROOT:

    node app/employer-workbook.mjs read
    node app/employer-workbook.mjs replace --input ABSOLUTE_TEMP_FILE
    node app/employer-workbook.mjs update --input ABSOLUTE_TEMP_FILE

--file PATH optionally selects a workbook; default is profile/companies.xlsx. Input is a JSON array whose keys are the exact Companies-sheet headings. replace is for approved initial setup and clears old employer values without rebuilding sheets/styles. Example: [{"Company":"Example employer","Group":"Design","Priority":"A","Careers page":"","Last checked":""}]. update accepts only Company (exact existing name), Careers page and Last checked (YYYY-MM-DD or empty), protecting Status and other user information. Both create profile/backups/ before atomic replacement and check concurrent edits. Do not replace or write a workbook open in Excel. The helper preserves this package's ordinary template formatting; it is not a general fidelity promise for arbitrary complex/macro workbooks.

If the workbook cannot be updated, record employer check dates/career URLs in data/reports/coverage.json and report the fallback. The agent owns that file.

## Excel export

The browser Export applications button downloads applications.xlsx using only saved jobs.json. A blank inventory exports a valid header-only workbook. Included records have an applicationDate or Applied/Interview/Offer/Rejected/Withdrawn status. Every included record needs a valid actual application date; no firstSeen substitution. Rows sort oldest first. Optional applicationStatusText overrides the English/German stage label. Titles/company/location are not translated. Excel strings remain literal even when starting with '='.

    node app/export-applications.mjs --output PATH

Run that from ROOT; --root DIR selects inventory. Existing output files are not overwritten. No private formatting template or LLM runtime is needed. Bundled ExcelJS provides a neutral formatted sheet with frozen header, filter, column widths and print settings. Export language comes from settings.
