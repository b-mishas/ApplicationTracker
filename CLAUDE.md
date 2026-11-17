# Working on ApplicationTracker

## Read before editing

Verify the actual working directory and Git root, read the relevant handoff, inspect branch, HEAD, upstream, latest commits and staged/unstaged/untracked changes, then read `PLAN.md`, `HISTORY.md` and `INTERFACE_FOR_TRACKER.md` for the task. Verify the actual code: a planned feature is not necessarily implemented. Preserve unfinished changes from other agents. Only one agent should edit a checkout at a time.

Select the handoff by function, regardless of which assistant performs the work:
- `HANDOFF_AGENT.md`: search orchestration, API fetching, extraction, filtering, discovery-batch preparation, prompts, setup/customization workflows, guides, profiles and their pristine templates. Supporting scripts such as `fetch-boards.mjs` belong here regardless of their directory.
- `HANDOFF_WRAPPER.md`: tracker UI, batch import/validation/storage, settings, Excel helpers, exports, tests, launchers and packaging.

Read the relevant handoff at the start. Read both when scope is unclear, work spans both areas, or the shared interface is affected. Verify the actual checkout state; either snapshot may describe an earlier branch or HEAD.

## Responsibilities and boundaries

Claude primarily maintains `agent/`, `guides/` and pristine `profile/` templates. Codex primarily maintains `app/`, settings, tests, launchers and packaging. Coordinate interface changes; keep `INTERFACE_FOR_TRACKER.md`, the routine and `app/SEARCH_WORKFLOW.md` consistent with tested behaviour.

Do not change the original personal tracker or its data. Runtime `data/`, customized profiles, employer workbooks, CVs and filled prompts are private. Never build a release from a customized installation. Keep CSS one rule per line.

## Handoff is required

Maintain `HANDOFF_AGENT.md` and `HANDOFF_WRAPPER.md` as separate operational snapshots. Update only the handoff relevant to work performed. For work spanning both areas, update both, keeping each focused on its own area and cross-referencing shared dependencies instead of duplicating detailed accounts. Do not rewrite the other area's handoff merely because its timestamp or Git HEAD is older.

After a meaningful verified milestone, before handing work to another assistant, and before ending a turn that changed code or project state, rewrite the relevant handoff as a compact current snapshot (about 200–400 words). Coalesce updates; do not append a session diary.

Include UTC update time, assistant, scope/objective, branch/HEAD/upstream, changed files and intent, completed work, verification/results, known failures, untested platforms, next action and active operations. Distinguish proposals from implemented changes. Mark remote/CI state as unverified unless checked. Replace stale information within the relevant scope and link durable documents instead of repeating them. Never include credentials or raw transcripts.

Keep `PLAN.md` shared for future work/design decisions and `HISTORY.md` shared for verified accomplishments. Do not mark planned work as accomplished. HISTORY.md is newest first: insert new entries directly below the 20-hyphen separator line under its introduction, above older entries. Separate handoffs do not authorize concurrent editing of the same checkout; only one assistant should edit a checkout at a time.

Updating these files does not authorize committing, pushing, stashing, switching branches or stopping another assistant's process. Do not commit or push unless the user asks. If a required handoff cannot be written, explain why and provide the snapshot in chat.

Commit subjects start with `[Prompt]` for changes to the agent prompts, guides and profile templates (`agent/`, `guides/`, `profile/`, `templates/`), and with `[Wrapper]` for the tracker app, launchers, tests and packaging. The text after the prefix starts with a capital letter (Sentence case), for example `[Prompt] Add link finder`.
