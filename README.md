# JobTracker

Standalone development repository for a portable job tracker and daily search-agent package. This is the starting code, not a finished end-user release.

## Layout

- `app/`: tracker, schema, importer and synthetic tests.
- `agent/`, `guides/`, `profile/`: Claude's supplied agent instructions and blank profile/employer templates.
- `data/`: private local inventory, batches, reports, backups and exports; excluded from Git.
- `INTERFACE_FOR_TRACKER.md`: agent-side integration assumptions supplied by Claude.
- `PORTABILITY.md`: agreed target contract and remaining implementation work.

## Development start

With Node available, run these from the repository root:

```text
node app/initialize.mjs
node app/server.mjs
```

The first command creates missing data folders and an empty inventory without overwriting existing records. The second starts the local tracker at http://127.0.0.1:8765. Open that address in a browser. The default data path is this installation's `data/` folder; `JOBTRACKER_DATA_DIR` overrides it.

## Checks

```text
node app/test-view-model.mjs
node app/test-import.mjs
node app/check.mjs
```

These run synthetic tests in temporary folders. They do not change the local inventory. An installation self-check is still to be implemented.

## Current limitations

Groups, countries and timezone still reflect the source tracker and need configurable replacements. Excel export still requires an external spreadsheet runtime and a private-format template; no template or personal application data was copied. Replace this dependency and create a neutral export before release. The source's two Excel regression tests were intentionally omitted because they depend on private application history; add portable export tests with synthetic fixtures instead.

The original installation remains separate. This repository starts a new Git history from its current working source snapshot, rather than importing personal historical Git commits. No remote is configured.

Do not share a customized working folder as a release: generate a clean distribution that excludes personal profile, CV, workbook and data contents.