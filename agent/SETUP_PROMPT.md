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

1. **Check the installation.** Confirm you can read and write ROOT. Read `app/README.md` and `app/SEARCH_WORKFLOW.md` and run `node app/self-check.mjs` from ROOT using the compatible Node path documented there. This checks the inventory, storage and Excel separately from batch validation. Then prove the import works where the scheduled run will work: write an empty test batch `{"schemaVersion":1,"runId":"setupcheck01","searchedAt":"<now, UTC, ending Z>","jobs":[]}` as `<today>-setupcheck01.json` into a temporary folder **outside** ROOT, run the importer on that file with `--validate-only` exactly as SEARCH_WORKFLOW.md documents (`--root` = ROOT's `data/` folder), expect exit code 0, then delete the test file. Verify the bundled workbook helper with `node app/employer-workbook.mjs read` from ROOT. It provides workbook access without Python or extra installation. If Node, the tracker or a check fails, stop and tell me exactly what to do.

2. **Collect my background.** Ask me to attach my CV (or put it into `profile/cv/`) and, if I have them, 3–6 job postings I applied to or found interesting, plus my verdict on each. Read them fully.

3. **Fill the profile.** Interview me with short, numbered questions (at most 6 per message, multiple choice where possible) to fill every section of `profile/candidate_profile.md`: target role families, levels, countries and remote rules, work authorization (where I may already work, where I would need sponsorship), preferred regions, relocation and on-site limits, strengths, confirmed gaps (and which are bridgeable), mismatch signals, special exclusions. Leave §8 for the next step. Use only what my CV and I confirm; never invent experience. Show me the filled profile and change it until I approve it.

4. **Review the fit definitions.** Show me the fit scale and the bridgeable-gap rule from profile §8 exactly as they are now, each level in one plain sentence with an example from my field. Ask whether I want to change any level or the bridgeable rule, and edit §8 accordingly. Keep the fixed frame: whole numbers 1–5, 5 is best, 3 or higher means "worth my attention". Then test the result: rate each example posting from step 2 using only the profile, without looking at my verdict (if I gave none, find 3–5 current postings in my field and ask me to rate them first). Show a table: posting | your fit | my fit | one-line reason. Where we differ by more than one point, name the profile section that caused it (strengths, gaps, bridgeable rule, mismatch signals or the scale) and propose a change. Repeat until every example is within one point, then save the postings with my fit and a one-line reason as calibration examples in §8.

5. **Confirm the tracker interface.** Read app/SEARCH_WORKFLOW.md. Search tracks and geography belong only in the approved profile; the agent writes group/countries into each position and the tracker derives its filters from those records. Do not configure group/country lists or a timezone in tracker Settings. Ask which Excel export language (English or German) I prefer and use the documented settings method only for that preference. Run node app/self-check.mjs. Verify that a scheduled importer on another host will use process TZ matching the timezone we choose for Part A; the local desktop normally needs no override. Never change code, schema or data to bypass validation.

6. **Build the employer list.** Propose 20–40 employers that fit my profile, each with group, country, sites, focus, role types, website and a priority A/B/C following the priority rule in the profile. Use web search to verify that each company exists and has relevant sites; mark anything unverified. After my approval, use the documented `app/employer-workbook.mjs replace --input FILE` helper with a temporary JSON array to populate `profile/companies.xlsx`. Keep formatting; remove the example employer and leave "Careers page" empty where unknown and "Last checked" empty. Do not assume Python or spreadsheet libraries exist.

7. **Job alerts.** Walk me through `guides/JOB_ALERTS_GMAIL.md`: one Gmail label (default `job-alerts`), a filter that sends alert emails there, and alerts on LinkedIn and the portals I choose, built from the profile's titles and countries. Then connect Gmail (Claude: Gmail connector; Codex: Gmail plugin) and confirm read-only that the label exists. Record the alert services and portals in profile §10.

8. **LinkedIn reading.** Ask me to sign in to LinkedIn myself in the browser the agent will use (Claude: the built-in browser in the desktop app; Codex: whatever browser access it has, see the Codex guide). Never enter my password yourself. Then open one LinkedIn job page read-only to confirm it works. If no browser is available, tell me plainly that LinkedIn roles will stay "Unverified" unless the employer's own page is found.

9. **Create the routine prompt.** Copy `agent/ROUTINE_PROMPT.md` from the line below the one that contains only `=== COPY FROM HERE ===` to the end (not the header comment that mentions it). Fill only the Part A placeholders (name, one-line description, ROOT path as it appears on this computer, Gmail label, time zone, summary language). Keep Part B character-for-character identical. Save the result as `agent/ROUTINE_PROMPT.filled.md` and show me Part A.

10. **Schedule it.** Ask me which weekdays and time. Then:
   - Claude: create a scheduled task named "Daily job search" with the filled prompt, weekdays at my time, access to ROOT, the Gmail connector, and approval mode that does not stop for every file action. Tell me which model it uses and recommend a capable one (not the smallest).
   - Codex: create an automation with the filled prompt, ROOT as project folder, my schedule, Gmail plugin enabled, web/network access allowed (it must read job sites) and permissions that allow unattended file reads and writes inside ROOT only. It must run directly in ROOT, not in a separate copy or worktree, otherwise results never reach my tracker. If you cannot create it yourself, give me numbered click-by-click steps from `guides/SETUP_CODEX.md`.
   Remind me that the computer must be on, the app running and `profile/companies.xlsx` closed at that time.

11. **Test run.** Start one run now (or ask me to press "Run now"). When it finishes, read its summary with me: did Gmail work, was anything imported, did the table appear, did LinkedIn access work? Fix only setup problems (settings, access, profile wording). Never change Part B to make a test pass; if Part B seems wrong for me, tell me and explain.
   Setup is finished only when all of these are true; tell me which one fails and why:
   - the summary says Gmail "OK" or "empty", not "not read";
   - the run's batch is in `data/incoming/imported/` and its report is in `data/reports/`;
   - `data/reports/coverage.json` exists and lists the sources that were checked;
   - new positions, if any, show up in the tracker;
   - the summary has the Import, New positions (or "No new positions added") and Coverage sections.

Rules for the whole setup: never apply to jobs, send messages or emails, or sign in on my behalf; Gmail stays read-only; do not edit tracker code or the batch schema; ask before deleting anything.

---------------------------------------------------------------- COPY UNTIL HERE
