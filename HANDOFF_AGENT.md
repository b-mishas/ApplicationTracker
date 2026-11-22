# Agent handoff

Updated 2026-11-22T00:27Z, Codex. Scope: rehearsal review and actionable guidance for Claude. main at 49aac06, level with local origin/main; remote/CI unverified. run-state v3 remains implemented; further simplification is proposed.

## Verified baseline

Milestone 8: two repetitions/arm, one fictional employer, announced stop after saved ratings. Both retained 4/4 relevant vacancies; helper cost $1.75 vs $1.52 (+14.9%). Helper avoided three known-role ratings but not their posting reads; repeated more work on resume. Plain imported one out-of-scope role; helper missed a due refresh. Codex checked final inventories and cumulative CLI costs; other measurements reviewed from retained scoring/report, not fully reconstructed. No tests/runs launched.

[Detailed review](rehearsal/runs/2026-11-21-handoff-recovery/evaluation/CODEX_REVIEW.md) and [Claude report](rehearsal/runs/2026-11-21-handoff-recovery/evaluation/REPORT.md) are Git-ignored evidence.

## Guidance for Claude: proposed next work

**1. Representative test.** Reuse the fixture/server/scorer. Three source surfaces, about 12–20 plausible finds: cross-source aliases, a distinct same-title requisition, an out-of-scope role, partial pagination, a transient access failure and a due refresh. Freeze ground truth first. Compare plain ledger and helper on the same current base, model and delegation policy. Measure ordinary uninterrupted work as well as recovery; do not give state helpers only favourable scenarios.

**2. Cheap verification first.** Reuse existing deterministic tests for identity, stale profiles, old pending work and import-commit-before-acknowledgement; add only missing assertions. These need no model calls. Then one agent pair for normal work. Exercise fresh-session recovery from saved snapshots; label manually seeded snapshots as synthetic, not evidence of automatic checkpoint creation. One actual unannounced interruption at a saved subagent-result boundary tests checkpoint discovery. Next-day resume receives the normal daily prompt, no rescue-file hint. Keep prior partial assessments and unfinished coverage in the fixture.

**3. Control spending.** Write the protocol and total cost ceiling before runs. Pin models explicitly; for Codex subagents use gpt-6.1-sol Medium, never inherited Astra. Use compact realistic postings, local fixtures, scripted scoring and small logs. Record cached/uncached input separately and actual cost. Stop on correctness failure, inspect artifacts, rerun only the failed case. One pair is directional; repeat only when needed for a decision. No broad browser/Gmail/portal suite yet.

**4. Simplification candidates.** Keep capture-time known/similar/new checks, durable assessments and discoverable pending work. Prefer one startup read, batched saves and inventory-derived delivery. Continue the same logical run within a day; next-day work gets a new date/run while referencing unfinished items and rechecking due work. Avoid separate helper calls solely for bookkeeping. Reuse sufficient evidence; partial/failed attempts remain incomplete and may need bounded retries. Remove extra commands only if plain state preserves these guarantees more cheaply.

## Limits and checkout

Recovery means continuing saved work after limits, crashes or a later scheduled run—not reconstructing conversation. Its frequency/value is unmeasured. No runtime, template, roadmap, packaging, automation, commit or push changes this review. Existing documentation edits and unrelated untracked design/ preserved. Rehearsal processes previously reported stopped; no active operations started here. Next: prepare the bounded protocol; expensive runs are not launched by this handoff.
