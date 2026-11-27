# Porting JobTracker wrapper features to ApplicationTracker

Reusable maintainer procedure for the reverse of JobTracker's `WRAPPER_PORTING.md`. Port selected behavior and its dependencies; preserve ApplicationTracker's portable, general-purpose installation. This is not a request to port anything, migrate an inventory or build a release.

## 1. Establish scope and pin the source

| Item | Location / authority |
|---|---|
| Source checkout (read-only) | `C:/Users/misha/Claude/Code/JobTracker` |
| Source Git root (verify) | `C:/Users/misha/Claude/Code`, with paths prefixed `JobTracker/` |
| Destination checkout | `C:/Users/misha/Claude/ApplicationTracker` |
| Current destination work | [HANDOFF_WRAPPER.md](HANDOFF_WRAPPER.md), [PLAN.md](PLAN.md), [HISTORY.md](HISTORY.md) |
| Shared contracts | [INTERFACE_FOR_TRACKER.md](INTERFACE_FOR_TRACKER.md), [app/SEARCH_WORKFLOW.md](app/SEARCH_WORKFLOW.md) |
| Destination conventions | [AGENTS.md](AGENTS.md), [CLAUDE.md](CLAUDE.md) |

Read applicable rules and wrapper handoffs in both checkouts. Verify both Git roots, branch, full HEAD, upstream and staged/unstaged/untracked changes. Source paths and old handoffs are clues, not proof of today's state. Preserve unfinished work; only one agent edits a checkout at a time. Reuse a suitable destination checkout; if isolation requires a new worktree, use the host's managed worktree tool. Never edit the original JobTracker or its runtime data.

Example read-only commands in PowerShell:

```powershell
git -C 'C:/Users/misha/Claude/Code/JobTracker' rev-parse --show-toplevel
git -C 'C:/Users/misha/Claude/Code' status --short
git -C 'C:/Users/misha/Claude/Code' log -5 --oneline -- JobTracker
git status --short
git diff --cached --stat
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
```

`-C` chooses the working directory; `rev-parse` identifies the repository or revision; `--show-toplevel` prints its root. `status --short` includes staged, unstaged and untracked work; `diff --cached --stat` summarizes staged edits. `log -5 --oneline` shows five compact commits, and `-- JobTracker` restricts history to that folder. The quoted `@{u}` names the configured upstream; absence of an upstream is a finding, not a reason to create one.

Pin the full source commit SHA for each requested feature. Read committed files with `git -C 'C:/Users/misha/Claude/Code' show FULL_SHA:JobTracker/public/app.js` (replace `FULL_SHA`); `show` reads that exact revision without switching branches. Inspect the commit diff and related fixes/tests. If needed work is still uncommitted or another session is editing it, resolve the intended snapshot before copying. Do not silently include unrelated source edits.

Check destination code and history first: a feature may already be ported, partially ported or superseded. JobTracker's `src/wrapper-source.json` tracks the opposite direction; it is not this project's reverse-port baseline. Record source SHAs, selected behavior and intentional omissions in HISTORY.md; do not invent a whole-wrapper synchronization claim. Avoid wholesale replacement or blind cherry-picking across the different layouts.

## 2. Map files and dependencies

| JobTracker source | ApplicationTracker destination | Adaptation |
|---|---|---|
| `public/app.js`, `index.html`, `style.css` | `app/` | Keep destination branding, Settings, export controls and served module paths. |
| `src/view-model.mjs`, `status-history.mjs`, `column-layout.mjs`, `group-colours.mjs` | `app/` | Review callers, persisted preferences and tests together. |
| `src/entry-editor.mjs`, `entry-form.mjs` | `app/` | Preserve general-purpose validation, free-text groups and country catalogue. Verify current source locations. |
| `src/server.mjs`, `config.mjs`, `store.mjs`, `jsonschema.mjs` | `app/` | Adapt imports, routes, initialization, paths and installation identity. |
| `src/settings.mjs`, `port-settings.mjs`, `startup.mjs`, `launch.mjs` | `app/` | Retain portable defaults, export preferences and per-installation lifecycle controls. |
| `src/countries.json`, `inventory.schema.json` | `app/` | Compare schemas and aliases; do not import personal configuration. |
| `scripts/import-discoveries.mjs`, `batch.schema.json` | `app/` | Preserve destination importer interface, exit codes and field ownership. |
| `tests/test-*.mjs`, `tests/check.mjs` | `app/` | Adapt imports, fixture paths, runtime assumptions and assertions. Register new suites in package.json. |
| `src/export-applications.mjs`, `print-applications.mjs` | Existing `app/` helpers | Translate relevant behavior into the destination exporter; do not replace it with the personal workbook implementation. |
| `public/flags/` | Existing `node_modules/flag-icons/flags/4x3/` route | Keep dependency assets and licensing; do not duplicate the source asset tree. |
| `src/wrapper-source.json`, source starters | package.json / optional BUILD_INFO.json, existing root starters | Keep destination version and lifecycle scheme; do not copy source metadata or installation identifiers. |

Verify paths at the pinned revision; new features can introduce files absent from this table. An HTML/CSS change may depend on API, model and validation changes. Keep CSS one rule per line and avoid unrelated reformatting.

Compare the source diff with destination code before applying a mapped patch. Imports, surrounding code and UI structure may have diverged even when filenames correspond. When they differ, port the behavior in small changes while retaining destination adaptations. If a patch rejects a section, inspect what already applied, resolve the remaining sections against both versions and remove temporary patch/reject files. Do not repeatedly apply the whole patch or overwrite destination files to force a match.

### New or changed field checklist

Trace each field through the full contract; mark items not applicable with a reason:

- [ ] Batch schema and semantic validation: type, format, optionality, unknown/empty values and invalid-record isolation.
- [ ] Saved-inventory schema/read compatibility: existing records, unknown fields and migration requirements.
- [ ] Import creation/merge: field ownership, observation freshness, blank preservation, repeat imports and manual-edit precedence.
- [ ] Editor: validation, editable/read-only metadata, explicit clearing, Save/Cancel and Undo.
- [ ] Display: formatting, unknown/invalid suppression, filtering/sorting/counts and exports where relevant.
- [ ] Agent instructions: routine and pristine template, shared interface and SEARCH_WORKFLOW; identify installed prompts needing regeneration.
- [ ] Verification and distribution: regression coverage, runtime module/dependency/license inclusion and curated release file list. Record release rebuilds as pending unless separately requested and performed.

## 3. Preserve destination contracts

- **Portable storage:** `app/config.mjs` defaults to installation-relative `data/`; settings default to `settings/tracker.json`. Retain `JOBTRACKER_DATA_DIR`, `JOBTRACKER_SETTINGS_FILE` and other existing override names. Never introduce JobTracker's personal external-data default or require its existing inventory/template workbook. Preserve empty-installation initialization.
- **Identity and routes:** keep ApplicationTracker health identity and matching installation hashes in server/launcher, its login-entry namespace, package version reporting and flat `app/` layout. Verify every browser import and API route. Settings/countries failures can prevent initial rendering.
- **Settings and exports:** retain `exportLanguage` (en/de), optional `exportName`, neutral defaults, ExcelJS export and destination print behavior. Do not hard-code the personal German workbook, filename, name, Artifact Tool paths or fixed export settings. Keep browser download name and server response header consistent.
- **Dates:** backend calendar dates use process-local time; hosted agents set `TZ` from routine Part A, and browser Today uses desktop-local time. Do not import hard-coded Europe/Berlin or derive local dates through UTC slicing. Preserve ISO calendar dates and the posting-date contract.
- **General-purpose inputs:** groups remain free text; countries use the catalogue with UK accepted as GB. No personal employer/group/location whitelist or search profile belongs in wrapper validation.
- **Storage and editing:** retain shared locks, atomic writes, byte-preserving backups, stale-revision rejection and Undo. Full Edit stages one draft; normal Status autosaves. IDs, bookkeeping and status history stay protected. Manual correction does not silently change later-import precedence.
- **Status semantics:** current status is authoritative; explicit empty dates suppress legacy fallback; same-status/notes-only saves must not reapply transition defaults. Preserve milestone totals, stage corrections and manual application text, including explicit blanks. Check destination tests and interface for exact rules.
- **Import/search interface:** retain batch validation, partial-batch handling, matching, protected user fields, RESULT output and exit codes. Coordinate actual contract changes in INTERFACE_FOR_TRACKER.md, app/SEARCH_WORKFLOW.md and routine/template together. A wrapper port does not authorize copying personalized agent prompts or runtime evidence.
- **Dependencies and packaging:** retain package.json/package-lock.json and the supported Node runtime. New runtime modules must enter the curated list in scripts/build-release.mjs, with relevant dependency/license changes. Editing that source list does not authorize running the builder. This guide stays in the maintainer repository, outside pristine templates and recipient ZIPs.

Search orchestration, candidate capture, checkpointing or recovery changes are separate agent work even when scripts live under app/. For those, read HANDOFF_AGENT.md and agent/orchestration/ORCHESTRATION_ROADMAP.md and follow their history/template requirements before designing a port.

## 4. Isolate verification and consider migrations

A worktree isolates code, not environment-selected data. Use disposable synthetic fixtures outside Git; do not copy or edit real application records just to test a feature. Use the destination fixture helpers and test patterns. For a manual server, first prepare valid disposable inventory and settings, then in a dedicated PowerShell session:

```powershell
$env:JOBTRACKER_DATA_DIR = 'C:/path/to/disposable-data'
$env:JOBTRACKER_SETTINGS_FILE = 'C:/path/to/disposable-data/tracker-settings.json'
$env:PORT = '0'
node app/server.mjs
```

Replace both paths with prepared fixtures. `$env:` sets child-process environment variables; port `0` asks the OS for an available port. Open the printed address. Close the dedicated session afterwards so overrides do not affect later work. Isolate login-registration paths using existing lifecycle-test patterns; do not touch real Startup entries or stop an unrelated server.

CSS-only changes usually need no migration. Changes to saved fields or view-state require legacy fixtures and preservation checks, including unknown fields, explicit blanks, per-preset widths/order/sort, counts and exports. Never reset saved preferences merely to make the new UI load. JobTracker migration markers and scripts are not automatically appropriate here.

If a migration is needed, implement a write-free preview, revision-checked apply, exact backup/report and repeat-safe transformation. Test all before/after fields except explicitly allowed changes, stable IDs/counts and a subsequent synthetic import. Do not infer historical dates or rebuild JSON from a spreadsheet. Implementing/testing a migration is separate from applying it to a real installation; report live migration as pending unless authorized and performed. Recovery requires compatible code and data while preserving later user edits.

## 5. Verify the affected behavior

For a UI port, check available browser tooling early: confirm that a supported browser can open an isolated fixture server before relying on it for acceptance. If a runtime or localhost restriction blocks that path, try an available supported alternative and record what remains unverified. Continue independent implementation and automated checks; do not present helper/headless test results as completed visual acceptance.

Run suites sequentially and inspect their fixture/port assumptions first. Do not kill unrelated processes to free ports. Use current package.json as the suite inventory.

| Changed behavior | Relevant destination checks |
|---|---|
| Filters, totals, sorting, column preferences | `node app/test-view-model.mjs`, `node app/test-column-layout.mjs`, `node app/test-group-colours.mjs` |
| Entry editor / staged draft | `node app/test-entry-editor.mjs`, `node app/test-entry-editor-ui.mjs`, `node app/check.mjs` |
| Notices | `node app/test-page-notice.mjs` plus browser flows |
| Import, locks, posting dates | `node app/test-import.mjs`, `node app/test-store-lock.mjs`, `node app/test-posted-dates.mjs` |
| Server, settings, export, portable installation | `node app/check.mjs`, `node app/test-portable.mjs` |
| Launcher/login/port settings | `node app/test-startup.mjs`, `node app/test-port-settings.mjs` |
| Coordinated pristine-template edits | `node app/test-templates.mjs` plus affected agent checks |

Each `node` command runs the named test script. Use `node --check PATH` to check changed JavaScript syntax without executing it. Run `git diff --check` for whitespace errors; if staging was requested, also use `git diff --cached --check`. For a broad wrapper/model port run `npm test` (the configured full suite); for a narrow change run affected checks. Do not rerun unrelated suites for documentation-only edits. Adapt source assertions to destination contracts while keeping equivalent regression coverage.

For UI changes, inspect the actual isolated browser:

- Correct title, flags, all views, no missing modules or console errors.
- Search, filters, counts, sort, resizing/reordering and per-preset persistence after reload; old saved preferences still restore.
- Row expansion/links and relevant keyboard actions; desktop and narrow layouts, with explicit manual widths preserved.
- Edit Save/Cancel, staged status/dates, explicit clears, stale-draft conflicts and Undo; no accidental writes during cancellation.
- Settings language/name, exported filename/header and workbook/print behavior when affected.
- Start/Restart/Stop and port conflict behavior when affected; no collision with JobTracker.

Record browser/viewport, fixtures, commands and results. Missing prerequisites or failed tests are not passes. Headless checks do not prove actual Windows/macOS login, touch-device behavior or recipient acceptance.

## 6. Finish with traceable evidence

Update HISTORY.md with the selected full source SHA(s), behavior, retained adaptations and verification. Rewrite HANDOFF_WRAPPER.md as a compact current snapshot, preserving other unfinished wrapper work and its limitations. Update PLAN.md only for changed future work; update both functional handoffs only when work actually spans both areas.

Report changed files, tests/browser results, migrations performed or pending, untested platforms, temporary-process cleanup and commit/push status. Remote/CI is unverified unless checked. Do not commit, push, restart a live installation or rebuild dist/ merely to finish a port. Commit/push and distribution builds require explicit requests. If packaging is requested separately, follow the existing release builder/audit procedure with pristine templates, neutral settings and empty inventory; current source verification does not prove older ZIPs contain the feature.
