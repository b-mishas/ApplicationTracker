# Running the job-search agent with Claude

## You need
- A paid Claude plan (Pro or higher) and the **Claude desktop app** (Windows or macOS).
- A Gmail account that receives your job alerts.
- The job-search folder (this package, with `app/` and `data/` from the tracker) somewhere on your computer, e.g. `Documents/JobSearch`.

## One-time setup (about 45 minutes)
1. **Install and sign in** to the Claude desktop app.
2. **Connect Gmail:** in Claude's settings, open *Connectors* and add Gmail; sign in with the Gmail account that gets your alerts. The agent only reads mail.
3. **Start a conversation** in the desktop app and give it access to your job-search folder (use the folder/attachment option next to the message box and pick the folder).
4. **Paste the setup prompt** from `agent/SETUP_PROMPT.md` and answer the questions. The assistant fills your profile and employer list, checks Gmail and creates the scheduled task.
5. **LinkedIn:** when asked, open the built-in browser of the desktop app (Ctrl+Shift+B on Windows, Cmd+Shift+B on Mac, or the globe icon) and sign in to LinkedIn yourself. The sign-in stays saved there.
6. **Test run:** open *Scheduled* in the left sidebar, open "Daily job search" and run it once. Read the summary with the assistant.

## Every day
- Leave the computer on (sleep is fine only if it wakes up for the run) and the Claude desktop app open at the scheduled time. The task needs your computer because it works with your files.
- Close `profile/companies.xlsx` in Excel before the run.
- Read the summary in *Scheduled* → "Daily job search" → latest run, or open the tracker.

## Good to know
- **Model:** pick a capable model for the task (not the smallest one); weak models rate fit badly. You can change it in the task's settings.
- **Changing the instruction** of a task that uses your computer needs one confirmation in the desktop app.
- **Approval mode:** choose the mode that does not ask before each action; otherwise unattended runs stop and wait.
- If a run says "Gmail not read", check *Connectors* and that the task has Gmail enabled.
- If it says "LinkedIn access: none", sign in to LinkedIn again in the built-in browser.

Official help: [Schedule recurring tasks in Claude](https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork).
