# Running the job-search agent with Codex

> Codex changes quickly. These steps follow OpenAI's public descriptions of Codex automations and the Gmail plugin as of late 2026; menu names may differ slightly. If something does not match, ask Codex: "Show me how to create a scheduled automation with access to this folder and the Gmail plugin."

The setup itself is a conversation: `START_HERE.html` gives you one instruction to paste, and the assistant leads you through every step. This page covers only what you must do yourself, and what to expect afterwards.

## You need
- A ChatGPT plan that includes Codex, and the **Codex desktop app** (Windows or macOS).
- A Gmail account that receives your job alerts.
- The extracted job-search folder somewhere you will keep it, e.g. `Documents/Application tracker`. Nothing else needs installing.
- Your CV. Setup duration depends on your decisions and access checks; saved progress can be resumed in a new conversation with the same folder.

## What only you can do
1. **Install and sign in** to the Codex app.
2. **Open the job-search folder as a project** in Codex and start a new thread there.
3. **Install the Gmail plugin:** sidebar → *Plugins* → Gmail → *Install*, then sign in with your alert account. The agent only reads mail.
4. **Approve** the profile, the employer list and the schedule when the assistant shows them.

## If Codex cannot create the automation itself
Sidebar → *Automations* → *New automation* → name "Daily job search" → project = your job-search folder → paste the raw content of `agent/ROUTINE_PROMPT.filled.md` → schedule: weekdays at your time → choose an available model/reasoning setting with the assistant after checking current capabilities → permissions: a mode that lets it read and write inside the project without asking each time, with web access allowed → if asked where it runs, choose the project folder itself (local), not a worktree or copy.

## Every day
- Keep the computer awake and the Codex app running at the scheduled time.
- Close `profile/companies.xlsx` in Excel before the run.

## What a normal run looks like
- **Run length varies.** A run reads every new alert mail and checks the employers due that day, so it takes longer after a weekend or with many alerts and can be short on a quiet day.
- **The first run usually says "Gmail: empty",** because new alerts need a day to arrive. That is correct.
- **The Coverage line at the end of the summary** shows how many alerts, employers and portals were due and how many were checked. "Not done: nothing" means the run was complete.

## Limits to expect
- **LinkedIn:** LinkedIn job pages need a signed-in browser. If your Codex setup has no browser that can use your LinkedIn sign-in, LinkedIn roles stay "Unverified" unless the employer's own page is found. They are still listed in the summary.
- **Use local execution:** select the actual installation folder rather than an isolated worktree. A Git repository is allowed; verify that a test run writes into the data folder your browser tracker uses.
- **Permissions:** with "ask before acting" modes, unattended runs pause. Prefer the narrowest mode that works unattended inside the project folder.

Official overview: [Codex automations](https://openai.com/academy/codex-automations).

## Pausing setup or changing the search later

Saved setup progress is in the same job-search folder. Ask the assistant to resume it rather than start over. Before changing an active configuration, pause its schedule and let any running search finish; the assistant will preserve approved topics and existing employers. New routine prompts stop while setup is being edited. If roles, geography or sources change, the assistant reviews the look-back and replays search checkpoints so newly eligible results are not missed.

Setup reports personalization, scheduled-operation verification and initial-search progress separately. An accepted LinkedIn limitation may use employer-page fallback; it does not prove direct LinkedIn access. A recoverable backlog remains partial. Empty imports need a separate temporary storage/backup probe in the scheduled environment. Model, scheduling and permission options must be checked against the current platform tools/help during installation.
