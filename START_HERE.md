# Daily job-search agent — start here

Every weekday an AI agent reads your job-alert emails, checks the career pages of your chosen employers and a few job portals, rates each new position against your profile (fit 1–5), saves it in your job tracker and writes you a short summary table. It never applies, sends messages or changes your CV.

## What you need
1. **One AI subscription with a desktop app:** Claude (Pro or higher, Claude desktop app) **or** ChatGPT with Codex (Codex app).
2. **A Gmail account** where your job alerts arrive.
3. **This folder** on your computer, e.g. `Documents/JobSearch`. It contains:

| Folder / file | What it is |
|---|---|
| `app/`, `data/` | The job tracker (where your positions are stored and shown) — see its own README |
| `profile/` | Your search profile and employer list — filled during setup |
| `agent/` | The daily routine, the setup prompt and the customization rules |
| `guides/` | Step-by-step guides for Claude, Codex and job alerts |

## Setup in 5 steps
1. Install the tracker as its README in `app/` describes (one-time).
2. Read the guide for your AI: `guides/SETUP_CLAUDE.md` or `guides/SETUP_CODEX.md`.
3. Set up your job alerts: `guides/JOB_ALERTS_GMAIL.md`.
4. Open a new conversation with access to this folder and paste the prompt from `agent/SETUP_PROMPT.md`. Answer the questions; the assistant fills your profile, builds your employer list and creates the daily schedule.
5. Do one test run together with the assistant.

## Daily use
- Keep the computer on and the AI app open at the scheduled time; close `profile/companies.xlsx` in Excel.
- Read the summary: a table of new positions, highest fit first, with the main gap for each.
- Mark positions in the tracker (shortlist, dismiss, applied). The agent respects your decisions.

## Changing your search later
Open a conversation with access to this folder and say what should change, starting with "Read `agent/CUSTOMIZE.md`." Examples are in that file.
