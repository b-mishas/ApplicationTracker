# Candidate profile — search rules for the daily job search

> This file is the agent's ground truth. The setup assistant fills it from your CV and an interview (agent/SETUP_PROMPT.md).
> Edit it in plain words whenever your search changes; the routine reads it fresh every run.
> Replace every `{{…}}` and every line starting with "Example:". Delete examples you do not need.

## 1. Who I am
- Name: {{NAME}}
- Current / last role: {{ROLE, EMPLOYER, YEARS}}
- Total relevant experience: {{e.g. 8 years industry + PhD}}
- Base location: {{CITY, COUNTRY}}
- Work authorization: I can already work in {{COUNTRIES}}; I would need visa sponsorship for {{COUNTRIES, or "none"}}
- Languages: {{e.g. English fluent, German C1}}

## 2. Target role families
List 2–6 families. For each: typical titles, and the level that fits.

| Family (= tracker group) | Typical titles | Fitting level |
|---|---|---|
| {{e.g. Data engineering in life sciences}} | {{Data Engineer, Senior Data Engineer, Lead}} | {{Senior or Lead}} |
| {{…}} | {{…}} | {{…}} |

Use these family names consistently in each position’s group field. The tracker derives groups from position JSON; there is no separate configured list.

Search keywords (used for portal searches and job alerts): {{e.g. data engineer, data platform, bioinformatics, LIMS}}

## 3. Seniority rules
- Below my level (keep, but mark seniority "Below level"): {{e.g. Junior, Associate}}
- Above my level (keep only if…): {{e.g. Director only at small companies}}
- No level stated in the posting: {{e.g. judge from required years and responsibilities; note "level not stated" in gaps}}

## 4. Geography
- Countries in scope: {{e.g. Germany, Austria, Switzerland}} (the agent writes recognized country codes into each position; no tracker search-country list is required). Countries where you need sponsorship (§1) may be in scope; the agent then checks each posting for sponsorship.
- Remote roles outside these countries: {{e.g. allowed if open to my country and within UTC±2}}
- Preferred regions (weighted higher when otherwise equal): {{e.g. within 50 km of my city}}
- Relocation: {{e.g. open to relocation within the DACH region / not open}}
- On-site limits: {{e.g. max 3 office days per week}}; hybrid with office days not stated: {{e.g. keep and note "office days not stated"}}

## 5. Strengths (what the agent can count as hands-on evidence)
- {{skill or achievement, with where/when}}
- {{…}}

## 6. Confirmed gaps (lower the fit only when essential and not bridgeable)
- {{e.g. no people-management experience}}
- {{e.g. no SAP experience}}
- Bridgeable (do NOT lower the rating): {{e.g. a new tool in a technique I already master}}

## 7. Mismatch signals (drop and count without reviewing, when clearly established)
- {{e.g. pure sales roles with quota}}
- {{e.g. roles requiring security clearance}}
- Always drop: US-only or other ineligible geography; clearly junior roles; unrelated fields.

## 8. Fit scale and calibration examples
### Fit scale (default; adapt the wording to your search)
Fixed frame, do not change: whole numbers 1–5, 5 is best, 3 or higher means "worth my attention".
- 5: strong core match at the right level; remaining gaps are bridgeable.
- 4: strong core match with a meaningful but manageable gap.
- 3: credible transition, or one material essential requirement missing.
- 2: substantial mismatch across essential requirements.
- 1: marginal relevance.

Bridgeable-gap rule: a gap is bridgeable when it is adjacent to my demonstrated core (§5). Bridgeable gaps are listed but do not lower the rating; the rating drops only for missing essential requirements that are not bridgeable, in proportion to how central they are.

### Calibration examples (fit the agent should reproduce)
Add 3–6 real postings you have already judged, from strong to weak. The setup assistant collects them and tests the scale against them.
- Example: Company X, Lead Data Engineer (Munich) = 5: right level, core stack matches; new cloud provider is bridgeable.
- Example: Company Y, Senior Analyst (Vienna) = 3: field fits, but one essential skill missing.
- Example: Company Z, Sales Engineer (Zurich) = 1: quota-carrying sales role.

## 9. Special exclusions
Roles never to re-report (beyond what the tracker already records as applied/rejected/dismissed):
- {{e.g. Company Q, Senior Engineer — declined offer, reposted often}}

## 10. Sources
### Job-alert emails (read via Gmail label from the routine's Part A)
| Service | Alerts set up | Source label |
|---|---|---|
| LinkedIn | {{search strings / countries}} | LinkedIn alert |
| {{e.g. StepStone, jobs.ch, Indeed}} | {{…}} | {{StepStone alert}} |

Alerts only (never browse the site directly): {{e.g. Indeed}}

### Portals to search directly
- Every run: {{e.g. jobs.ch, Nature Careers}}
- Rotation: Monday {{…}}; Tuesday {{…}}; Wednesday {{…}}; Thursday {{…}}; Friday: catch-up and weakest-covered role/country combinations.

### Known coverage gaps the agent should search explicitly
- {{e.g. remote roles in Spain are not covered by alerts}}

### Employer schedule
Default: priority A every run, B Monday and Thursday, C Friday. Priority rule used in `profile/companies.xlsx`:
- A: {{e.g. plausible employer for my target level, in scope, preferred region}}
- B: {{e.g. plausible, but harder location or fewer matching roles}}
- C: {{long shot}}
