# Agent handoff

Updated 2026-11-24T15:35Z, Claude. Scope: port JobTracker's 23–24 Nov fixes listed in `APPLICATIONTRACKER_FIXES.md` (untracked, left in place). main at 8663380 ([Agent] port) on 1c42e6f ([Wrapper] store lock), two commits ahead of origin/main, not pushed. Uncommitted: fixes from scheduled rehearsal run 1 (routine and template: exact subagent model values, `subagents` written before start, required capture check before any reading, one agent in the browser at a time with its own tab; read-posting.mjs refuses job-board URLs; rehearsal spend-cap rule in rehearsal/README.md), and ROADMAP.md contents now link to generated heading anchors (headings lost their numbers and ✅; raw `<a id>` anchors are stripped by many viewers). Remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Changed (committed in 8663380)

- `app/capture-check.mjs`: job IDs match only under the same company; an identical posting URL also under a company-name variant; other shared IDs/URLs give a `similar … (same URL or job ID, other company label)` hint. `--open` groups ledger lines by the same rule. Locations also overlap by shared city words (`placeWords`, Wien = Vienna). Exports `rowsOf`, `findOf`, `strongIds`.
- `app/import-discoveries.mjs` `urlIdentity`: keeps `#/` and `#!/` route fragments (keys are computed on the fly, never stored).
- New `app/finish-run.mjs` (+ `record-dropped.mjs`) and `app/read-posting.mjs`, ported from JobTracker; kind `employer` instead of `company`; run from ROOT. Added to `npm test` and the release file list.
- Routine and template (identical): `--retry-for` at setup; `read-<n>`/`read-lead`, `links-<n>`/`links-lead`, `refresh-<n>`, `evidence-<name>` files; `at` on every evidence line; due.json; finish-run before the summary (rereads, one retry of sources without an error); the agent no longer writes `dropped` or `refreshed` (now `{lastAttemptedAt, lastConfirmedAt}`); portal `progress`; web fetch never a full description; careers pages with no jobs opened in the browser; "Last checked" never moves back; gaps only unmet requirements. `reread: true` in the ledger replaced by `read-lead.jsonl`.
- INTERFACE_FOR_TRACKER.md, app/SEARCH_WORKFLOW.md, roadmap state sentence, ORCHESTRATION_HISTORY, HISTORY, PLAN item 2.

## Judgements

- Items 1–2 already fixed in ac8fa4b. Item 9 (board script) not ported. Item 8 ported although optional: without it the web-fetch rule makes every posting a browser reread.
- `unfinished` (agent) kept next to finish.json `retry` (script); they overlap by design.

## Verification

- Ported tests (capture-check variants, record-dropped, finish-run, read-posting offline, store lock); the capture-check scenarios fail on e182954. `npm test` exit 0; `git diff --check` clean. No agent run; prompt edits checked by rereading only. Prompt grew from about 7,170 to 8,240 words.

## Next action

- Fold the ROADMAP.md link fix into the next substantive commit.
- Scheduled rehearsal `rehearsal/runs/2026-11-24-scheduled-claude/` (Cowork routine `trig_01Ctas6LcvghQUjzvgvg4C6J`, paused). Run 1 had no spend cap, read 7 days (143 mails) and stopped at the 5-hour limit; findings and the reset are in its `evaluation/README.md`. Before run 2: the user replaces the task's instructions with the regenerated filled prompt, then one attended Run now (Gmail capped by checkpoint to about one to two days). Its cost needs a signed-in claude.ai tab for run-usage.cjs. Open decision: whether a recipient's first run should read fewer than 7 days.
- Rebuild the Mac packages before the next release (dist/ Windows is from 8663380, Mac from 330274f).

No active operations.
