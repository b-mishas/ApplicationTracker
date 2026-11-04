# JobTracker checkpoint

Updated: 2026-11-04 22:51 UTC. Last agent: Codex. Scope: standalone repository root. Branch: main; initial source snapshot, no upstream/remote configured. PR/CI: not configured.

## Objective

Create a portable, personal-data-free job-search tracker plus Claude's agent package for a nontechnical Windows/macOS recipient. See PORTABILITY.md for the agreed interface and remaining acceptance criteria. Creating this repository is complete; producing a finished downloadable release is not.

## Current state

Tracker source is in app/. It includes current uncommitted improvements from the original installation, based on source commit 2aa2e67, without copying its personal Git history. Claude's supplied ZIP was unpacked into agent/, guides/ and profile/, preserving its interface document and instructions. The workbook is a template with one explicitly labelled example employer. The original ZIP remains locally, excluded from Git. Original source, running server and inventory were not modified.

config.mjs now defaults to this installation's data/; JOBTRACKER_DATA_DIR remains supported. initialize.mjs creates an empty inventory and folders using exclusive file creation, preserving existing data. Runtime data is excluded from Git. Personal documentation, temporary maintenance script and private-history Excel regression tests were omitted.

## Verification

Windows/Node: 54/54 importer tests passed; view-model and API/save checks passed. Repeat initialization preserved the inventory byte-for-byte. A separate server on port 18765 served the UI and empty default inventory successfully, then stopped. Text scan found no original user's name or private storage paths in the copied tree. Profile/workbook inspected as templates. Browser appearance, macOS and Excel export remain unverified.

## Next action

Implement configurable settings and installation self-check, replace private Excel dependencies with portable export, then add bundled runtimes and platform launchers. Reconcile agent assumptions before building a clean distribution. Do not present the development snapshot as an end-user release.