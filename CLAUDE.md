# Working on ApplicationTracker

## Read before editing

Read `HANDOFF.md`, inspect the current branch, latest commits and working-tree changes, then read `PLAN.md`, `HISTORY.md` and `INTERFACE_FOR_TRACKER.md` for the task. Verify the actual code: a planned feature is not necessarily implemented. Preserve unfinished changes from other agents. Only one agent should edit a checkout at a time.

## Responsibilities and boundaries

Claude primarily maintains `agent/`, `guides/` and pristine `profile/` templates. Codex primarily maintains `app/`, settings, tests, launchers and packaging. Coordinate interface changes; keep `INTERFACE_FOR_TRACKER.md`, the routine and `app/SEARCH_WORKFLOW.md` consistent with tested behaviour.

Do not change the original personal tracker or its data. Runtime `data/`, customized profiles, employer workbooks, CVs and filled prompts are private. Never build a release from a customized installation. Keep CSS one rule per line.

## Handoff is required

At the start, read `HANDOFF.md`. After a meaningful verified milestone, before an agent switch, and before ending a turn that changed code or project state, rewrite it as a compact current snapshot (about 200–400 words). Coalesce updates; do not append a session diary.

Include UTC update time, agent, objective, branch/HEAD/upstream, changed files and intent, completed work, exact tests/results, known failures, untested platforms, next action, and active operations. Mark remote/CI state as unverified unless checked. Replace stale information and link durable docs instead of repeating them. Never include credentials or raw transcripts.

Keep `PLAN.md` for upcoming work and design decisions, `HISTORY.md` for verified accomplished steps, and `HANDOFF.md` for the latest operational snapshot. Do not mark planned work as accomplished.

Updating the handoff does not authorize committing, pushing, stashing, switching branches or stopping another agent's process. Do not commit or push unless the user asks. If the handoff cannot be written, say so and provide the snapshot in chat.
