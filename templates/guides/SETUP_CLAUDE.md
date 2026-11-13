# Running the job-search agent with Claude

The setup itself is a conversation: `START_HERE.html` gives you one instruction to paste, and the assistant leads you through every step. This page covers only what you must do yourself, and what to expect afterwards.

## You need
- A paid Claude plan (Pro or higher) and the **Claude desktop app** (Windows or macOS).
- A Gmail account that receives your job alerts.
- The extracted job-search folder somewhere you will keep it, e.g. `Documents/Application tracker`.
- Your CV, and about an hour and a half. You can stop after the employer list and continue the next day.

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
- **It takes a while.** A complete run reads every alert mail and checks every employer due that day; expect half an hour or more. A run that finishes within a few minutes has skipped work.
- **It uses a good part of your plan's daily allowance.** Schedule it for a time when you are not using Claude heavily yourself. If runs stop with a usage-limit message, tell the assistant; fewer alerts or employers reduce the load.
- **The first run usually says "Gmail: empty",** because new alerts need a day to arrive. That is correct.
- **The Coverage line at the end of the summary** shows how many alerts, employers and portals were due and how many were checked. "Not done: nothing" means the run was complete.

## If something goes wrong
- **"Gmail not read":** check *Connectors*, and that the task has Gmail enabled.
- **"LinkedIn access: none":** sign in to LinkedIn again in the built-in browser.
- **The run stops and waits:** choose the approval mode that does not ask before each action.
- **Poor fit ratings:** pick a capable model for the task (not the smallest one) in the task's settings.
- **Changing the task's instruction** needs one confirmation in the desktop app.

Official help: [Schedule recurring tasks in Claude](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).
