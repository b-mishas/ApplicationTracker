# Job alerts into one Gmail label

The agent reads one Gmail label every day (default name `job-alerts`). Everything that should be searched must arrive there.

## 1. Create the label
Gmail (web) → left sidebar → *Labels* → *Create new label* → `job-alerts`.

## 2. Create a filter per alert sender
Gmail → gear icon → *See all settings* → *Filters and Blocked Addresses* → *Create a new filter*.
- **From:** the sender address of the alert emails (open one alert email to see it; LinkedIn alerts usually come from `jobalerts-noreply@linkedin.com`).
- *Create filter* → tick **Apply the label: job-alerts** (optionally *Skip the Inbox*) → also tick *Apply filter to matching conversations*.
Repeat for every job portal you use.

Alerts that arrive in another mailbox (e.g. Outlook, Yahoo): set up automatic forwarding of those alert emails to your Gmail address, then filter them as above.

## 3. Create the alerts
Use the titles from profile §2 and the countries from §4.

**LinkedIn:** Jobs → search with keywords and a location → turn on *Set alert* → frequency *Daily*, notification by *email*. One alert per keyword group and country works best. Check your list under *Job alert settings*.

**Other portals** (StepStone, jobs.ch, Indeed, Xing, academic job boards …): log in, run your search, save it as an email alert, daily.

Tips:
- Keep each alert focused (title family + country). Broad alerts flood the agent with noise.
- Indeed: use only its email alerts, and have the assistant mark it "alerts only" in your profile so the agent never browses it directly.
- Prefer alert services whose emails link to each job. Where an email lists jobs without links, the agent can only search the web for the employer's posting and may not find it.
- After a few days, ask the assistant: "Which alert sources produced relevant roles?" (it keeps statistics in `data/reports/coverage.json`).

## 4. Check
Alerts need about a day to arrive. Next day, open the label: alert emails should be inside. A run on the day you create the alerts reports "Gmail: empty"; that is correct. Later runs report "Gmail: OK".
