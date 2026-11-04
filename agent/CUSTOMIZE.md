# Customization rules

The agent has three layers. Only the first two are personal.

| Layer | File | Who changes it | When |
|---|---|---|---|
| 1. Profile (what to look for) | `profile/candidate_profile.md` | You, in plain words, or the assistant on your request | Any time your search changes |
| 2. Employers | `profile/companies.xlsx` | You or the assistant | Add/remove employers, change priority |
| 3. Personal settings | `agent/ROUTINE_PROMPT.md`, **Part A** only | Setup assistant | Once at setup; again if folder, label, time zone or language change |
| Fixed core | `agent/ROUTINE_PROMPT.md`, **Part B** | Nobody (package maintainer only) | Never during customization |
| Tracker | `app/`, `data/` | Nobody (the tracker manages itself) | Only via the tracker's documented settings |

## What stays identical (Part B)
Safety rules (no applying, no messages, no sign-in, Gmail read-only), work order and budget, Gmail checkpointing, how postings are read, verification states (Reviewed / Title only / Open / Closed / Unverified), the fit scale and bridgeable-gap rule, deadline handling, duplicate rules, batch and import procedure, coverage checkpoint format and the summary format. These rules keep the agent compatible with the tracker. Changing them breaks imports or makes results unreliable.

## What must be rewritten for each person
- Part A: name, one-line description, folder path, Gmail label, time zone, summary language.
- Profile §1–§10: everything. Pay most attention to §2 (role families and levels), §4 (countries), §6 (confirmed gaps and what is bridgeable) and §8 (calibration examples) — these decide the fit ratings.
- Employer list: your own 20–40 employers with priorities.
- Tracker settings: groups, supported countries and time zone must match the profile (done by the setup assistant through the tracker's settings).

## What may be adjusted, but only in the profile
- Employer schedule (default A daily, B Mon/Thu, C Fri).
- Portal list and weekday rotation.
- Mismatch signals and special exclusions.
- Which sources are "alerts only" (never browsed directly).

## Rules for the assistant doing the customization
1. Edit only the profile, the employer list, Part A and documented tracker settings.
2. Copy Part B verbatim. Do not shorten, translate or "improve" it.
3. Never invent experience, skills or dates; mark anything unverified.
4. Group names and country codes in the profile must exist in the tracker settings.
5. Keep the profile in plain language; the agent rereads it every run.

## Changing things later — prompts that work
Open a conversation with access to the job-search folder and send, for example:
- "Read `agent/CUSTOMIZE.md`. Add the role family '…' with levels '…' to my profile and to the tracker groups. Show me the change first."
- "Read `agent/CUSTOMIZE.md`. Add these employers to `profile/companies.xlsx` with priority B: … Verify each website."
- "Read `agent/CUSTOMIZE.md`. In my profile, treat '…' as a bridgeable gap from now on, and add this posting as a calibration example with fit 4: …"
- "Read `agent/CUSTOMIZE.md`. My scheduled job search should run at 07:00 instead. Change only the schedule."
- "Read the last job-search summary and tell me why '…' got fit 2. If the profile caused it, propose a profile change."

## Updating to a newer package version
Replace `agent/ROUTINE_PROMPT.md` Part B and `app/` with the new version; keep your `profile/`, `data/` and the filled Part A. Then ask the assistant: "Read `agent/CUSTOMIZE.md`, rebuild `agent/ROUTINE_PROMPT.filled.md` from the new Part B and my existing Part A, and update my scheduled task with it."
