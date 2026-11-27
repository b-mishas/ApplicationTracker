# Codex instructions for ApplicationTracker

## Start with the current checkout

Verify the actual working directory and Git root, then read the relevant handoff, PLAN.md, HISTORY.md and INTERFACE_FOR_TRACKER.md. Check branch, HEAD, upstream and staged/unstaged/untracked changes. Read CLAUDE.md for coordinated repository conventions. Verify implementation against code; plans are not completed features. Do not rerun full checks solely for onboarding.

Select the handoff by function, regardless of which assistant performs the work:
- `HANDOFF_AGENT.md`: search orchestration, API fetching, extraction, filtering, discovery-batch preparation, prompts, setup/customization workflows, guides, profiles and their pristine templates. Supporting scripts such as `fetch-boards.mjs` belong here regardless of their directory.
- `HANDOFF_WRAPPER.md`: tracker UI, batch import/validation/storage, settings, Excel helpers, exports, tests, launchers and packaging.

Read the relevant handoff at the start. Read both when scope is unclear, work spans both areas, or the shared interface is affected. Verify the actual checkout state; either snapshot may describe an earlier branch or HEAD.

## State-driven orchestration roadmap

Before designing, implementing or reviewing search sequencing, candidate capture, persistent state, checkpointing, interruption recovery, run-evidence retention or summary reconciliation, read [agent/orchestration/ORCHESTRATION_ROADMAP.md](agent/orchestration/ORCHESTRATION_ROADMAP.md). Use it to select the next milestone and its verification criteria; check current code before treating any item as implemented. Amend the roadmap only when the overall plan changes (scope, priorities, sequencing or design direction); do not expand it or update it for routine implementation progress. Record implementation details, decisions, verification and limitations in [agent/orchestration/ORCHESTRATION_HISTORY.md](agent/orchestration/ORCHESTRATION_HISTORY.md), with brief entries in root HISTORY.md and current state in the relevant handoff. It is maintainer guidance, not a replacement for the installed routine, profile or importer contract; do not load it into every scheduled search or copy it into pristine templates. Unrelated tracker UI work does not require reading it.

## Scope and collaboration

Codex primarily owns app/, tracker settings, importer, Excel helpers, tests, launchers and packaging. Claude primarily owns agent/, guides/, profile/ and pristine templates/. Coordinate shared interface changes and keep INTERFACE_FOR_TRACKER.md and app/SEARCH_WORKFLOW.md consistent with implemented behavior.

Preserve all unfinished work. Only one agent should edit a checkout at a time. Stage explicit files or hunks belonging to the requested work; do not sweep Claude's changes into a Codex commit. Do not commit or push without an explicit user request. A previous completed commit/push request does not authorize later changes automatically.

Do not modify the original personal tracker at C:\Users\misha\Claude\Code\JobTracker, its data, or use the older Applications workspace as this project's source. Personalized profiles, settings, CVs, workbooks, filled prompts and runtime data are private and must stay out of Git/releases. Retain JOBTRACKER_* environment-variable names unless the user requests a change.

## Porting wrapper features from JobTracker

Before porting JobTracker UI, storage/import, settings, export or launcher features into this project, read [WRAPPER_PORTING.md](WRAPPER_PORTING.md). It defines source pinning, file mapping, destination contracts, isolated verification and completion evidence. Keep JobTracker read-only; adapt selected features rather than replacing the wrapper wholesale.

## Distribution builds

Prepare, rebuild or modify dist/ ZIP files and their checksums only when the user explicitly asks. Routine development, UI edits, tests, commits and pushes do not authorize a distribution rebuild. For routine testing, use the source checkout and explain when the ZIP does not include newer changes.

When explicitly asked to package, use the release builder with pristine templates, neutral settings and an empty inventory. Never package a customized installation. Remove local development mock positions before shipping as tracked in PLAN.md; confirm the archive contains no mock or personal inventory. Preserve third-party notices and licensing.

## Implementation and verification

Keep changes focused and CSS one rule per line. Use the existing importer/storage/settings helpers to preserve backups, atomic writes, revision checks and user-owned fields. Do not edit real application records to exercise tests; use temporary fixtures, except for mock data explicitly requested by the user.

Run checks appropriate to the change. For UI changes, inspect actual browser rendering and interactions when possible. Distinguish automated/headless checks from physical-device or recipient acceptance. State untested platforms and failures plainly. Avoid redundant full checks after relevant checks pass.

## Handoff and durable records

Maintain `HANDOFF_AGENT.md` and `HANDOFF_WRAPPER.md` as separate operational snapshots. Update only the handoff relevant to work performed. For work spanning both areas, update both, keeping each focused on its own area and cross-referencing shared dependencies instead of duplicating detailed accounts. Do not rewrite the other area's handoff merely because its timestamp or Git HEAD is older.

After a meaningful verified milestone, before handing work to another assistant, and before ending a turn that changed code or project state, rewrite the relevant handoff as a compact current snapshot (about 200–400 words). Coalesce updates; do not append a session diary.

Include UTC update time, assistant, scope/objective, branch/HEAD/upstream, changed files and intent, completed work, verification/results, known failures, untested platforms, next action and active operations. Distinguish proposals from implemented changes. Mark remote/CI state as unverified unless checked. Replace stale information within the relevant scope and link durable documents instead of repeating them. Never include credentials or raw transcripts.

Keep `PLAN.md` shared for future work/design decisions and `HISTORY.md` shared for verified accomplishments. Do not mark planned work as accomplished. HISTORY.md is newest first: insert new entries directly below the 20-hyphen separator line under its introduction, above older entries. Separate handoffs do not authorize concurrent editing of the same checkout; only one assistant should edit a checkout at a time.

Keep plans current: show what is done, what remains, and the supporting evidence. Distinguish implementation from verification or acceptance; mark an objective complete when all its requirements are met.

Updating these files does not authorize committing, pushing, stashing, switching branches or stopping another assistant's process. Do not commit or push unless the user asks. If a required handoff cannot be written, explain why and provide the snapshot in chat.

## Communication

The user is a programming novice at approximately CS50 introductory level. Briefly explain commands and flags when giving commands to the user, and explain relevant code/algorithm choices when useful. For responses covering multiple steps or topics, use clear formatted headings, numbering and occasional helpful emojis. Keep focused updates concise.

Commit subjects start with a prefix chosen by function, the same split as the handoffs, not by directory: `[Agent]` for the search agent, meaning prompts, guides, profile templates, orchestration docs and the scripts the agent runs (for example `app/capture-check.mjs`), with their tests; `[Wrapper]` for the tracker UI, importer, storage, settings, Excel helpers, exports, launchers and packaging. A commit spanning both takes the prefix of its main purpose; split it when both parts stand alone. Older commits use `[Prompt]` for `[Agent]`. The text after the prefix starts with a capital letter (Sentence case), for example `[Agent] Add link finder`.
