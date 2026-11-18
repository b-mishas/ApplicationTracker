# Agent handoff

Updated 2026-11-18 01:56 UTC, Claude. Scope: routine token-cost changes from Codex's review (previous version of this file), implemented in prompt and profile templates.

Checkout: C:/Users/misha/Claude/ApplicationTracker; branch main, HEAD 63fcb39, no upstream. Remote/CI unverified. Nothing committed or staged. Untracked design/ preserved. Wrapper state: HANDOFF_WRAPPER.md (unchanged).

## Changed (uncommitted)

- agent/ROUTINE_PROMPT.md = templates/agent/ROUTINE_PROMPT.md: Completion states done / not due / deferred / partial / failed, no unlimited-effort wording, `unfinished` work counts within the limits. Subagents: full batches, last batch flushed per step, capability test on a real item; mails one per started 30 (at most three at a time); postings ten; employers ten or portals two–three per subagent, smallest model only with a cached method that worked before, otherwise middle; §9 scope rules passed; per-source limit fifteen calls or five minutes, wait over 10 s = deferred. Employers due by profile schedule, default A 3 / B 7 / C 14 days, next-due order, never-checked first by oldest `lastAttempt`, at most twenty attempts per run; method cache with one rediscovery; career URLs five per run. Shortlisted refresh rule (never refreshed, 3 days, or deadline within 10 days and not today; shares reads with re-checks; skips exhausted re-checks). Weekly gap searches with catch-up. coverage.json: `employers[].lastAttempt`, `method`, `refreshed`. Summary Coverage counts extended.
- profile/candidate_profile.md, agent/CUSTOMIZE.md (+ templates/ copies): new default schedule and its tradeoff; gap searches weekly on Monday.
- app/SEARCH_WORKFLOW.md, INTERFACE_FOR_TRACKER.md: new coverage fields; old files mean empty.
- PLAN.md: employer model comparison; board-script requirements (deferred). HISTORY.md: entry added; Codex's review entry moved to the top (it sat below older entries).

## Deviations from the review

- Employer attempts recorded as `employers[].lastAttempt`, not as `sources` entries (one source entry per employer would bloat `sources`, and every source entry needs six fields).
- Board script not ported (agreed deferral).

## Verification

Static only: agent/, profile/, guides/ equal their templates/ copies; git diff --check clean; npm test exit 0. Traced: empty and 95-mail intervals; old coverage file; 21 due employers; repeatedly blocked never-checked employer; missed Monday; capped pagination (partial, no Last checked, no method); failed refresh; same-day near-deadline rerun; exhausted re-checks. Known gap: a Shortlisted record whose refresh read keeps failing is retried every run.

No live run, no model comparison, no ZIP rebuild; filled profiles and live schedules untouched.

## Next

User review, then commit on request (`[Prompt]`; app/SEARCH_WORKFLOW.md and INTERFACE_FOR_TRACKER.md belong in the same commit). Then a rehearsal with measured cost and the employer model comparison (PLAN.md).
