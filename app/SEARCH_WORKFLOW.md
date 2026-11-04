# Discovery import contract

From `app/`, using Node in the current execution environment:

```text
node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --validate-only
node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data --dry-run
node import-discoveries.mjs incoming/YYYY-MM-DD-<runId>.json --root ../data
```

Validation checks input; dry-run previews merging; the final command imports accepted records. In a mounted environment replace `../data` with the actual data path. Relative incoming paths are resolved within that data folder. Read `batch.schema.json` for exact accepted fields and values. Filename runId must match the envelope; every sources[].file equals the batch filename. UTC timestamps describe instants; the current implementation uses Europe/Berlin for calendar dates pending configurable timezone support.

Exit codes: 0 success (inspect ambiguous count), 2 invalid envelope/all records rejected, 3 lock/conflict, 4 data/write failure, 5 partial success with rejected records. The final stdout line is `RESULT {json}`. Reports are written to `reports/<batch filename>.report.json`.

Only the importer writes discovery updates to jobs.json. User-owned status, notes, identifiers, first-found date, manual urgency and application information are preserved. Partial batches require reviewing rejected records; absence from a search never closes a job. Writers share locking, backups and atomic replacement; never delete a lock while a writer might be running.

Settings are not wired yet: current groups/countries are still the source defaults. The target is `settings/tracker.json` (see `../PORTABILITY.md`); do not assume editing that file changes validation yet. Deadline/agent urgency fields are not supported in the current schema. Report deadlines in the search summary without overwriting manual urgency.

Employer inventory belongs in `../profile/companies.xlsx`; the tracker does not read it. Read the profile and workbook rules for search policy; the tracker imposes none.