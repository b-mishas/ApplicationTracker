# Local rehearsal run index

Run folders are deliberately excluded from Git and release packages. The links below resolve only in a checkout that retains these local records. See [the directory guide](../README.md) for preservation and future-run conventions.

| Retained folder | Contents / entry point |
|---|---|
| `legacy-sam-rehearsal/` | Earlier fictional-candidate installation, moved from `rehearsal/Application tracker/`; no new verification of that historical search. |
| `agent-rehearsal-20261118-terra/` | Early data/profile/settings fixture; original layout retained. |
| `candidate-terra-20261118T111728Z/` | Installation, evaluator records, scratch files and original manifest; original layout retained. |
| `terra-rehearsal-20261118-1416/` | [Evaluation report](terra-rehearsal-20261118-1416/evaluation/REPORT.md). |
| `terra-followup-20261119/` | [Contentful follow-up report](terra-followup-20261119/evidence/REPORT.md). |
| `terra-rehearsal-20261119T201042Z/` | [Evaluation report](terra-rehearsal-20261119T201042Z/evaluation/REPORT.md) and [candidate–Terra prompt log](terra-rehearsal-20261119T201042Z/evaluation/REHEARSAL_PROMPT_LOG.md). |
| `2026-11-21-small-model-acceptance/` | [Milestone 6 report](2026-11-21-small-model-acceptance/evaluation/REPORT.md): Claude Sonnet 5.5 lead with Haiku 5.5 subagent, helpers (18a85df) vs no helpers (b66c262) on three Greenhouse boards; equal outcomes, helpers 57% more input. |

The latest listed run used separate Terra agents for interactive setup and a daily-style continuation. Its scoped exclusions do not establish full setup acceptance. Read its evaluation report for passed, failed and blocked checks.

The historical reports and prompts have not been rewritten after relocation. Resolve their old absolute roots using `../relocation-manifest.json`; relative paths within each moved run remain valid. The current run pointer is `../current-rehearsal-path.txt`.
