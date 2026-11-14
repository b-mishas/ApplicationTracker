# Application tracker

A local job tracker and daily search-agent package. The GitHub/source repository is named ApplicationTracker.

## Recipient

Download Application-tracker-windows-x64.zip for Windows x64 or Application-tracker-mac-intel.zip for an Intel Mac. Extract it into the folder you want to keep and open START_HERE.html. Open the included Start file; the tracker opens in a browser and runs locally in the background. Node, flags and Excel support are included; no package installation is needed. Give your assistant this whole folder and follow agent/SETUP_PROMPT.md; it helps define your search profile after interviewing you; groups and countries are assigned in position JSON.

Runtime information lives in data/, settings/tracker.json, customized profile/ and agent/ROUTINE_PROMPT.filled.md. Back up those together. Do not share a customized installation as a distribution.

## Development

Use Node 22 or newer. From this repository root:

    npm ci --ignore-scripts
    node app/initialize.mjs
    npm test
    node app/launch.mjs

npm ci installs pinned dependencies for development; the final recipient ZIP already contains them. initialize creates missing settings and an empty inventory without overwriting existing files. launch starts a background server on a free local port and opens the browser; Start (Windows).cmd restarts this installation's running server before opening the browser. The macOS starter reopens the running tracker. Use the matching Stop file to stop it.

    node app/self-check.mjs

The self-check verifies installation, schema, inventory, temporary storage/backup, export round-trip and employer template. It returns zero on success and nonzero on failure. No tracker search/time configuration is required. Tests and probes never change actual job records.

## Build

    npm run build

The default build verifies pinned Node runtimes for Windows x64 and macOS Intel, then produces dist/Application-tracker-windows-x64.zip and dist/Application-tracker-mac-intel.zip, each with one runtime and a .sha256 checksum. ARM64 runtimes remain pinned in scripts/runtime-manifest.json but are not built by default. Use `node scripts/build-release.mjs --target TARGET` for an individual target. Initial build needs internet and the system tar utility. The builder uses templates/ for agent, guide and profile files, never data/ or a customized profile. Runtime downloads are cached in .build-cache/; runtime/, dist/ and the cache stay outside Git. Refresh pristine templates deliberately when maintaining the source docs.

## Maintenance

Read CLAUDE.md, HANDOFF.md, PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md before changing the contract. Settings schema and commands are documented in app/SEARCH_WORKFLOW.md. See THIRD_PARTY_NOTICES.md for bundled software.

Windows verification and macOS acceptance are distinct. See the latest handoff for actual test results. The project does not upload data automatically. Repository commits/pushes are explicit developer actions.

Release audit: node scripts/audit-release.mjs ZIP_PATH checks an archive, including workbook XML. For private-source checks, pass --deny-terms PATH to an external JSON array of forbidden strings. The builder accepts JOBTRACKER_RELEASE_DENY_TERMS_FILE for the same check. Keep private markers outside the source repository. JOBTRACKER_BUILD_CACHE can select an existing official-runtime archive cache.
