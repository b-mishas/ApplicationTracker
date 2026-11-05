# Application tracker checkpoint

Updated: 2026-11-05 UTC. Last agent: Claude. Scope: C:\Users\misha\Claude\ApplicationTracker. Branch main; Codex commits 45f07a3 (implementation) and b0d7288 (checkpoint), followed by Claude's agent-docs commit. GitHub/origin: b-mishas/ApplicationTracker. Claude's commit is local and not pushed; PR/CI not checked.

## Current state

Portable tracker plus search-agent package for a nontechnical recipient. Settings, importer safeguards, Excel export/workbook helpers, self-check, bundled Windows/macOS runtimes and Start/Stop launchers are in 45f07a3. READ ME.html is the single recipient starting guide. See PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md for durable scope and interfaces.

Claude's commit adds templates/ (pristine agent/, guides/, profile/ copies the release builder requires; byte-identical to the working copies) and Codex's integration edits to agent/ROUTINE_PROMPT.md, agent/SETUP_PROMPT.md and guides/SETUP_CODEX.md: workbook access via app/employer-workbook.mjs (no Python), self-check and settings commands, report-filename rule, local execution instead of "no Git".

JOBTRACKER_* environment-variable names are kept at the user's request, consistently in code, tests and docs; no APPLICATIONTRACKER_* remain. Health app name, schema title and package name use ApplicationTracker.

## Verification

Codex: npm test passed (54/54 importer, view-model/API, 10 portable checks); release ZIP built, audited and smoke-tested on Windows. Claude: confirmed employer-workbook.mjs read works on templates/profile/companies.xlsx, and that self-check --require-configured and the documented settings/workbook commands exist. No test rerun by Claude (only Markdown and template files changed).

## Next action

Push when the user approves. Then: add the fit-calibration step to SETUP_PROMPT.md and templates/agent/ (agreed in principle, not started); review INTERFACE_FOR_TRACKER.md "Release blockers" against 45f07a3, which implemented several of them. Real macOS, Windows ARM64, personalized scheduled-agent/connector acceptance and recipient usability remain pending. Old "JobTracker" new-session preset in the Claude app still points at the deleted folder; the user must fix it in the app. No release published; no processes running.
