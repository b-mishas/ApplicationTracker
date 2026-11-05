# Application tracker

A local job tracker and daily search-agent package. The GitHub/source repository is named ApplicationTracker.

## Recipient

Download the maintainer-built Application-tracker.zip, extract it into the folder you want to keep and open READ ME.html. Open Start Windows.cmd or Start macOS.command; the tracker opens in a browser and runs locally in the background. Node, flags and Excel support are included; no package installation is needed. Give your assistant this whole folder and follow agent/SETUP_PROMPT.md; it helps configure groups, countries and timezone after interviewing you.

Runtime information lives in data/, settings/tracker.json, customized profile/ and agent/ROUTINE_PROMPT.filled.md. Back up those together. Do not share a customized installation as a distribution.

## Development

Use Node 22 or newer. From this repository root:

    npm ci --ignore-scripts
    node app/initialize.mjs
    npm test
    node app/launch.mjs

npm ci installs pinned dependencies for development; the final recipient ZIP already contains them. initialize creates missing settings and an empty inventory without overwriting existing files. launch starts a background server on a free local port and opens the browser; repeated launches reuse this installation's running server. Use the matching Stop file to stop it.

    node app/self-check.mjs
    node app/self-check.mjs --require-configured

The first checks the installation, schema, inventory, temporary storage/backup, export round-trip and employer template. Empty unpersonalized settings produce an informational message. The second also requires groups, countries and timezone. Both return zero on success and nonzero on failure. Tests and probes never change actual job records.

## Build

    npm run build

The builder downloads four official pinned Node archives (Windows x64/ARM64 and macOS Intel/Apple silicon), checks SHA-256 hashes, bundles dependencies and licenses, and produces dist/Application-tracker.zip plus its checksum. Initial build needs internet and the system tar utility. It uses templates/ for agent, guide and profile files, never data/ or a customized profile. Runtime downloads are cached in .build-cache/; runtime/, dist/ and the cache stay outside Git. Refresh pristine templates deliberately when maintaining the source docs.

## Maintenance

Read CLAUDE.md, HANDOFF.md, PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md before changing the contract. Settings schema and commands are documented in app/SEARCH_WORKFLOW.md. See THIRD_PARTY_NOTICES.md for bundled software.

Windows verification and macOS acceptance are distinct. See the latest handoff for actual test results. The project does not upload data automatically. Repository commits/pushes are explicit developer actions.

Release audit: node scripts/audit-release.mjs checks the actual archive, including workbook XML. For private-source checks, pass --deny-terms PATH to an external JSON array of forbidden strings. The builder accepts JOBTRACKER_RELEASE_DENY_TERMS_FILE for the same check. Keep private markers outside the source repository. JOBTRACKER_BUILD_CACHE can select an existing official-runtime archive cache.
