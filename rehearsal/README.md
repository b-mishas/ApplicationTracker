# Retained job-search rehearsals

This directory holds local rehearsal records that should survive build-cache cleanup. It is separate from `.build-cache/`, which holds disposable build downloads and development scratch files. Automated tests remain in `app/`; a live rehearsal's installation and evidence are not automated-test fixtures.

## Layout

```text
rehearsal/
  README.md                       Shared directory guide
  prepare.mjs                     Local legacy scenario helper
  usage.mjs                       Local legacy Claude-log usage helper
  relocation-manifest.json        Local original/new paths and SHA-256 hashes
  relocation-verification.json    Local move/preservation results
  current-rehearsal-path.txt       Local pointer to the latest retained run
  runs/
    README.md                     Shared run index and conventions
    <run-name>/
      installation/               Isolated app, profile, workbook and inventory
      evaluation/                 Reports, prompt logs, checks and native logs
```

Historical runs keep their existing folder names and internal layouts. Some use `evidence/` or `evaluator/` instead of `evaluation/`; one early fixture contains only data/profile/settings. The older root-level `Application tracker/` installation is retained under `runs/legacy-sam-rehearsal/installation/`.

## Preservation and privacy

- All run artifacts, local pointers, manifests and legacy helpers are excluded through the shared `.gitignore`. Only this guide and `runs/README.md` are eligible for Git. The release builder's explicit file list does not include this directory.
- Retain the reports, conversation logs, source evidence, ledgers, batches, importer reports, coverage and workbook together. Do not treat a run folder as a disposable cache or automatically delete it.
- Git exclusion prevents accidental commits; it is not a backup. Copy important runs to a separate backup if needed.
- Historical files keep the exact contents and paths recorded at the time. `relocation-manifest.json` maps their old roots to their current locations; `relocation-verification.json` checks file hashes after the move. Do not rewrite transcripts or old evidence to make their paths look current.
- The moved installations are archived snapshots, not installed automations. Their filled prompts can still name the former ROOT. Before any separately authorized continuation, regenerate personal ROOT settings at the new path while preserving Part B, and recheck local installation settings. Do not run archived helper scripts blindly: some contain historical absolute paths or write data.

## Future runs

Create a new, unique folder under `runs/`, preferably `YYYY-MM-DD-description`, with an isolated `installation/` and an `evaluation/` directory. Start with pristine templates and an empty inventory unless the task explicitly calls for saved-state continuation. Use a separate employer workbook. Keep personal installations and installed automations untouched.

Cap spend before any rehearsal starts, and write the caps in the run report. Use a USD cap where the runner offers one (CLI runs: about USD 5, as in milestones 10 and 12). Scheduled tasks and automations offer none, so cap the scope through the installation's data instead: set coverage.json `gmailCheckedThrough` to about the start time, so the first run reads about one day of alerts, not the seven days a missing checkpoint gives; keep the employer workbook small. Run a scheduled rehearsal once attended and disable the schedule until its first run has been reviewed.

Record the source commit, scope, model, times, available native usage, exclusions and verification limits in the run report. The [run index](runs/README.md) links retained reports; update it when adding a run. Creating a directory does not authorize starting a search, scheduling, packaging or publishing.
