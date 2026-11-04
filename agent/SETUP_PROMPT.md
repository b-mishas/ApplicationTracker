# Setup prompt — paste this into Claude or Codex once

How to use: open a new conversation in the Claude desktop app (give it access to your job-search folder) or a new Codex thread with the job-search folder as the project. Copy everything between the two lines below into the message box and send it. Then answer the assistant's questions. Setup takes about 30–60 minutes.

---------------------------------------------------------------- COPY FROM HERE

You are setting up my personal daily job-search agent from a ready-made package. I am not technical: explain each step in one or two plain sentences, ask me before anything that changes settings or creates a schedule, and never ask me to type commands myself unless there is no other way.

The package is in my job-search folder (call it ROOT). It contains:
- `app/` and `data/` — the job tracker (do not edit code here);
- `profile/candidate_profile.md` and `profile/companies.xlsx` — templates you will fill with me;
- `agent/ROUTINE_PROMPT.md` — the daily routine prompt (Part A = my settings, Part B = fixed core);
- `agent/CUSTOMIZE.md` — the rules for what may and may not be changed;
- `guides/` — platform and job-alert guides.

Read `agent/CUSTOMIZE.md` first and follow it strictly. Then do these steps in order. After each step, tell me in one line what is done and what comes next.

1. **Check the installation.** Confirm you can read and write ROOT. Read `app/README.md` (or the tracker's start file) and run the tracker's own self-check if it documents one. If something is missing or fails, stop and tell me exactly what to do.

2. **Collect my background.** Ask me to attach my CV (or put it into `profile/cv/`) and, if I have them, 3–6 job postings I applied to or found interesting, plus my verdict on each. Read them fully.

3. **Fill the profile.** Interview me with short, numbered questions (at most 6 per message, multiple choice where possible) to fill every section of `profile/candidate_profile.md`: target role families, levels, countries and remote rules, preferred regions, relocation and on-site limits, strengths, confirmed gaps (and which are bridgeable), mismatch signals, calibration examples, special exclusions. Use only what my CV and I confirm; never invent experience. Show me the filled profile and change it until I approve it.

4. **Align the tracker settings.** Make the tracker's configurable settings (groups, supported countries, time zone — as `app/` documents them) match the approved profile, using only the method the tracker documents. Do not change code or the batch schema.

5. **Build the employer list.** Propose 20–40 employers that fit my profile, each with group, country, sites, focus, role types, website and a priority A/B/C following the priority rule in the profile. Use web search to verify that each company exists and has relevant sites; mark anything unverified. After my approval, write them into `profile/companies.xlsx` (sheet "Companies", keep the formatting, delete the example row, leave "Careers page" empty where unknown and "Last checked" empty).

6. **Job alerts.** Walk me through `guides/JOB_ALERTS_GMAIL.md`: one Gmail label (default `job-alerts`), a filter that sends alert emails there, and alerts on LinkedIn and the portals I choose, built from the profile's titles and countries. Then connect Gmail (Claude: Gmail connector; Codex: Gmail plugin) and confirm read-only that the label exists. Record the alert services and portals in profile §10.

7. **LinkedIn reading.** Ask me to sign in to LinkedIn myself in the browser the agent will use (Claude: the built-in browser in the desktop app; Codex: whatever browser access it has, see the Codex guide). Never enter my password yourself. Then open one LinkedIn job page read-only to confirm it works. If no browser is available, tell me plainly that LinkedIn roles will stay "Unverified" unless the employer's own page is found.

8. **Create the routine prompt.** Copy `agent/ROUTINE_PROMPT.md` from "=== COPY FROM HERE ===" to the end. Fill only the Part A placeholders (name, one-line description, ROOT path as it appears on this computer, Gmail label, time zone, summary language). Keep Part B character-for-character identical. Save the result as `agent/ROUTINE_PROMPT.filled.md` and show me Part A.

9. **Schedule it.** Ask me which weekdays and time. Then:
   - Claude: create a scheduled task named "Daily job search" with the filled prompt, weekdays at my time, access to ROOT, the Gmail connector, and approval mode that does not stop for every file action. Tell me which model it uses and recommend a capable one (not the smallest).
   - Codex: create an automation with the filled prompt, ROOT as project folder, my schedule, Gmail plugin enabled and permissions that allow unattended file reads and writes inside ROOT only. If you cannot create it yourself, give me numbered click-by-click steps from `guides/SETUP_CODEX.md`.
   Remind me that the computer must be on, the app running and `profile/companies.xlsx` closed at that time.

10. **Test run.** Start one run now (or ask me to press "Run now"). When it finishes, read its summary with me: did Gmail work, was anything imported, did the table appear, did LinkedIn access work? Fix only setup problems (settings, access, profile wording). Never change Part B to make a test pass; if Part B seems wrong for me, tell me and explain.

Rules for the whole setup: never apply to jobs, send messages or emails, or sign in on my behalf; Gmail stays read-only; do not edit tracker code or the batch schema; ask before deleting anything.

---------------------------------------------------------------- COPY UNTIL HERE
