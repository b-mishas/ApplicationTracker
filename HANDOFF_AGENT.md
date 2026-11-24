# Agent handoff

Updated 2026-11-24T10:40Z, Claude. Scope: port JobTracker's 23–24 Nov fixes listed in `APPLICATIONTRACKER_FIXES.md` (untracked, left in place). main at e182954 = origin/main; all changes below are uncommitted. Remote/CI unverified. `design/` is unrelated untracked work. No installed-automation change.

## Changed (uncommitted)

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

- User review, then commit (`[Agent]`; the store lock part could go as `[Wrapper]`, see HANDOFF_WRAPPER.md).
- First real run: check finish.json against the summary's Not done, that due.json and `at` are written, and read-posting's reach in Claude and Codex shells.
- Rebuild dist/ before the next release.

No active operations.
