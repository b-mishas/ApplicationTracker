# Running the job-search agent with Claude

The setup itself is a conversation: `START_HERE.html` gives you one instruction to paste, and the assistant leads you through every step. This page covers only what you must do yourself, and what to expect afterwards.

## You need
- A paid Claude plan (Pro or higher) and the **Claude desktop app** (Windows or macOS).
- A Gmail account that receives your job alerts.
- The extracted job-search folder somewhere you will keep it, e.g. `Documents/Application tracker`.
- Your CV. Setup duration depends on your decisions and access checks; saved progress can be resumed in a new conversation with the same folder.

## What only you can do
1. **Install and sign in** to the Claude desktop app.
2. **Give the conversation your folder:** use the folder/attachment option next to the message box and pick the job-search folder.
3. **Connect Gmail:** in Claude's settings, open *Connectors*, add Gmail and sign in with the account that gets your alerts. The agent only reads mail.
4. **Sign in to LinkedIn** in the built-in browser of the desktop app when the assistant asks (it can open the browser for you). The sign-in stays saved there.
5. **Approve** the profile, the employer list and the schedule when the assistant shows them.

## Every day
- Leave the computer on (sleep is fine only if it wakes up for the run) and the Claude desktop app open at the scheduled time. The task needs your computer because it works with your files.
- Close `profile/companies.xlsx` in Excel before the run.
- Read the summary in *Scheduled* → "Daily job search" → latest run, or open the tracker.

## What a normal run looks like
- **Run length varies.** A run reads every new alert mail and checks the employers due that day, so it takes longer after a weekend or with many alerts and can be short on a quiet day.
- **It uses a good part of your plan's daily allowance.** Schedule it for a time when you are not using Claude heavily yourself. If runs stop with a usage-limit message, tell the assistant; fewer alerts or employers reduce the load.
- **The first run usually says "Gmail: empty",** because new alerts need a day to arrive. That is correct.
- **The Coverage line at the end of the summary** shows how many alerts, employers and portals were due and how many were checked. "Not done: nothing" means the run was complete.

## If something goes wrong
- **"Gmail not read":** check *Connectors*, and that the task has Gmail enabled.
- **"LinkedIn access: none":** sign in to LinkedIn again in the built-in browser.
- **The run stops and waits:** choose the approval mode that does not ask before each action.
- **Model:** set the task to Sonnet in its settings. Confirm currently available models and choose based on measured quality and usage; the routine delegates supported simple reading where available.
- **Changing the task's instruction** needs one confirmation in the desktop app.

Official help: [Schedule recurring tasks in Claude](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).

## Pausing setup or changing the search later

Saved setup progress is in the same job-search folder. Ask the assistant to resume it rather than start over. Before changing an active configuration, pause its schedule and let any running search finish; the assistant will preserve approved topics and existing employers. New routine prompts stop while setup is being edited. If roles, geography or sources change, the assistant reviews the look-back and replays search checkpoints so newly eligible results are not missed.

Setup reports personalization, scheduled-operation verification and initial-search progress separately. An accepted LinkedIn limitation may use employer-page fallback; it does not prove direct LinkedIn access. A recoverable backlog remains partial. Empty imports need a separate temporary storage/backup probe in the scheduled environment. Model, scheduling and permission options must be checked against the current platform tools/help during installation.
