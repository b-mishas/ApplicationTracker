# Running the job-search agent with Codex

> Codex changes quickly. These steps follow OpenAI's public descriptions of Codex automations and the Gmail plugin as of late 2026; menu names may differ slightly. If something does not match, ask Codex: "Show me how to create a scheduled automation with access to this folder and the Gmail plugin."

## You need
- A ChatGPT plan that includes Codex, and the **Codex desktop app** (Windows or macOS).
- **Node.js** installed (the tracker needs it; see the tracker's README for the version and a one-click installer).
- A Gmail account that receives your job alerts.
- The job-search folder (this package, with `app/` and `data/`), e.g. `Documents/JobSearch`.

## One-time setup (about 45 minutes)
1. **Install and sign in** to the Codex app.
2. **Open the job-search folder as a project** in Codex.
3. **Install the Gmail plugin:** sidebar → *Plugins* → Gmail → *Install*, then sign in with your alert account. The agent only reads mail.
4. **Start a new thread** in the project, paste the setup prompt from `agent/SETUP_PROMPT.md`, and answer the questions.
5. **Create the automation** (Codex may do it for you): sidebar → *Automations* → *New automation* → name "Daily job search" → project = your job-search folder → paste the content of `agent/ROUTINE_PROMPT.filled.md` → schedule: weekdays at your time → reasoning: high → permissions: a mode that lets it read and write inside the project without asking each time.
6. **Test run:** run the automation once and read the summary with Codex.

## Every day
- Keep the computer awake and the Codex app running at the scheduled time.
- Close `profile/companies.xlsx` in Excel before the run.

## Limits to expect
- **LinkedIn:** LinkedIn job pages need a signed-in browser. If your Codex setup has no browser that can use your LinkedIn sign-in, LinkedIn roles stay "Unverified" unless the employer's own page is found. They are still listed in the summary.
- **Permissions:** with "ask before acting" modes, unattended runs pause. Prefer the narrowest mode that works unattended inside the project folder.

Official overview: [Codex automations](https://openai.com/academy/codex-automations).
