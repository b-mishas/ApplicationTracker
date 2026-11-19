# Agent handoff

Updated 2026-11-19T21:39:24.1363227Z, Codex. Scope: adapt the supplied JobTracker posting-access and employer-coverage corrections to this project's routine. Checkout C:/Users/misha/Claude/ApplicationTracker, main at 1fbdd54c496c96e0cf2724b3926f28bf65f1b42d, upstream origin/main; remote/CI unverified. This snapshot accompanies the requested prompt commit; HEAD above is pre-commit. No push, package, live search or installed automation update.

## Completed and changed files

agent/ROUTINE_PROMPT.md and its identical templates/agent copy now distinguish unattended work from interactive user sign-in, allow existing user-established sessions, require a full-description access test and record actual browser failures. Employer-first company/title link finding precedes LinkedIn-only reads; finder rounds remain once per candidate per run, including refreshes and re-checks. Delegation capability is task-specific so LinkedIn failure does not disable supported mail/public ATS work.

Selected employers must be reconciled against results under exact workbook names. Missing results/cache methods, name mismatches and unsupported methods require follow-up within the existing limits, never a successful coverage date. Public paginated listing/detail endpoints are preferred. No board script was ported: PLAN.md still defers it pending state-safety design. Coverage schema, importer and workbook interface remain unchanged. HISTORY.md records the verified prose milestone; agent/orchestration/ROADMAP.md records the updated baseline without marking any state milestone complete.

## Retained work and verification

Preserve all pre-existing tracked and untracked changes, including project rules, wrapper handoff, plan, README, ignore rules, design/ and rehearsal/. The state-driven roadmap remains agreed design only and is excluded from this commit because the whole file belongs to earlier uncommitted work; its baseline note remains in the working copy. Retained rehearsal evidence and relocation details remain under rehearsal/README.md and rehearsal/runs/README.md; archived prompts retain historical paths. No other area's handoff was rewritten.

Exact routine/template SHA-256 parity and git diff --check passed; reviewed fallback paths against existing limits and coverage fields. No runtime behavior, browser access, scheduled permissions or platform acceptance was tested. No active agents, searches or servers were started.

## Next action

Installed filled prompts and scheduled tasks still need regeneration through agent/CUSTOMIZE.md when requested. Live access/coverage effectiveness remains unverified. Persistent-state implementation still starts at roadmap milestone 1; this prompt correction does not implement it. ZIPs retain their previous contents.
