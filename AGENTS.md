# Codex instructions for ApplicationTracker

## Start with the current checkout

Verify the actual working directory and Git root, then read HANDOFF.md, PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md. Check branch, HEAD, upstream and staged/unstaged/untracked changes. Read CLAUDE.md for coordinated repository conventions. Verify implementation against code; plans are not completed features. Do not rerun full checks solely for onboarding.

## Scope and collaboration

Codex primarily owns app/, tracker settings, importer, Excel helpers, tests, launchers and packaging. Claude primarily owns agent/, guides/, profile/ and pristine templates/. Coordinate shared interface changes and keep INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md consistent with implemented behavior.

Preserve all unfinished work. Only one agent should edit a checkout at a time. Stage explicit files or hunks belonging to the requested work; do not sweep Claude's changes into a Codex commit. Do not commit or push without an explicit user request. A previous completed commit/push request does not authorize later changes automatically.

Do not modify the original personal tracker at C:\Users\misha\Claude\Code\JobTracker, its data, or use the older Applications workspace as this project's source. Personalized profiles, settings, CVs, workbooks, filled prompts and runtime data are private and must stay out of Git/releases. Retain JOBTRACKER_* environment-variable names unless the user requests a change.

## Distribution builds

Prepare, rebuild or modify dist/ ZIP files and their checksums only when the user explicitly asks. Routine development, UI edits, tests, commits and pushes do not authorize a distribution rebuild. For routine testing, use the source checkout and explain when the ZIP does not include newer changes.

When explicitly asked to package, use the release builder with pristine templates, neutral settings and an empty inventory. Never package a customized installation. Remove local development mock positions before shipping as tracked in PLAN.md; confirm the archive contains no mock or personal inventory. Preserve third-party notices and licensing.

## Implementation and verification

Keep changes focused and CSS one rule per line. Use the existing importer/storage/settings helpers to preserve backups, atomic writes, revision checks and user-owned fields. Do not edit real application records to exercise tests; use temporary fixtures, except for mock data explicitly requested by the user.

Run checks appropriate to the change. For UI changes, inspect actual browser rendering and interactions when possible. Distinguish automated/headless checks from physical-device or recipient acceptance. State untested platforms and failures plainly. Avoid redundant full checks after relevant checks pass.

## Handoff and durable records

Rewrite HANDOFF.md as a compact current snapshot (about 200–400 words) after a meaningful verified milestone, before an agent switch and before ending a turn that changed code or project state. Include UTC update time, agent, scope/objective, branch/HEAD/upstream, changed files and intent, verification/results, failures/untested platforms, next action and active operations. Mark remote/CI unverified unless checked. Coalesce rather than append a diary.

Maintain PLAN.md for future work/design decisions and HISTORY.md for verified accomplishments. Updating these files does not authorize committing, pushing, stashing, switching branches or stopping another agent's process.

## Communication

The user is a programming novice at approximately CS50 introductory level. Briefly explain commands and flags when giving commands to the user, and explain relevant code/algorithm choices when useful. For responses covering multiple steps or topics, use clear formatted headings, numbering and occasional helpful emojis. Keep focused updates concise.
