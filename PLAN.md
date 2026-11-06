# Application tracker — plan

The source repository is ApplicationTracker; the visible product is Application tracker. See HISTORY.md for completed steps and HANDOFF.md for the current session snapshot.

## Delivery milestone

Completed: configurable settings; no-write validation; installation self-check; portable Excel and employer helpers; reconciled agent documentation; bundled runtimes and platform starters; one-file ZIP; Windows clean-extraction/repeat-start tests. See HISTORY.md for verification.

Remaining acceptance work:
- Test first launch, approval prompts, importer, workbook helper, export and stop/restart on a real Mac (Intel and/or Apple silicon). Inspect launch guidance against the observed experience.
- Test Windows ARM64 on actual hardware; only Windows x64 execution has been verified here. All four runtime archives are checksummed and Mac executable ZIP permissions are verified.
- Run the complete personalized agent setup and one scheduled search with each intended LLM environment. Packaging tests do not establish connector availability or unattended permissions.
- Have a nontechnical recipient try the complete setup and correct any confusing instructions.
- Review and commit Claude’s agent and template changes separately from the tracker source. Publish a release only when explicitly requested.

## Colour and record-driven settings — implemented decisions

- Fit and Group are coloured by default; no Colour selector or group-colour setting.
- Group palette starts with the original teal/blue/amber/purple hues. A greedy maximin algorithm selects further pastel hues by Oklab distance, considering both fill and text while keeping original saturation/lightness. First eight distinct swatches are tested for contrast and separation.
- Automatic groupColours metadata in jobs.json keeps assignments stable through sorting, filtering, additions, removals and reloads. This is tracker-managed display metadata, not a configured list of search groups.
- Search tracks and geography belong in the candidate profile; the agent assigns group/countries per position. Filter options come from position JSON, with bundled flags for recognized codes and text fallback for legacy unknown codes.
- Removed group/country fields, the newly added country picker and the tracker timezone setting. Settings holds the optional name for export titles and the export language. Existing settings files are accepted; retired fields are ignored and dropped on the next explicit save with a backup.
- Imports no longer depend on a settings file, configured group/country whitelists or personalization readiness. Country structure/catalogue validation remains, including the UK alias for GB.
- Dates use local computer time automatically. Hosted scheduled importers must set standard process TZ to Part A's timezone. Test this across midnight in the scheduled-agent rehearsal.
- Later possibility: a coordinated UK/GB normalization migration, preserving existing records and agent compatibility.

## Application stage emphasis — implemented

- Applied: bold gold-brown row text; Interview: bold dark-emerald row text. Both retain normal alternating row backgrounds.
- All row markers use a consistent 3 px width. Interview uses green on the main row and expanded details.
- Offer uses a green background and hover treatment, a gold left accent and a gold dollar badge.
- Rejected: grey text, links and muted badges, with editing still available. The Active preset excludes rejected records. All includes them.
- Styling follows saved status immediately, independent of sorting and filtering. Fit and Group retain their own badge colours for Applied/Interview.

## Application stage editing and filters — implemented

- New, Shortlisted, Active and All are the four quick presets. Active includes New, Shortlisted, Applied, Interview and Offer.
- Expanded status and interview outcome changes save immediately. Save changes and Cancel act on pending form edits. New, Shortlisted and Dismissed show only Status among the stage fields. Applied shows its application date next to Status and application status text below. Interview and Offer add milestone rows. Rejected and Withdrawn show recorded interview milestones. Rejected hides Offer date while retaining any saved value.
- Keep a primary status and separate interview/offer fields in the saved inventory. Selecting an interview outcome updates the primary status in the same save. Selecting Pending returns it to Interview. Excel includes the dated milestone sequence.
- The tracker saves search text and filters per installation. Reloading and restarting restore the saved view. Reset saves the default view.

## Development mock data — remove before shipping

- Local ignored data/jobs.json contains five fictional positions with IDs dev-mock-fit-1 through dev-mock-fit-5 and Fit scores 1–5. Companies start with MOCK and notes explicitly mark them as development data.
- Remove these five mock positions before shipping; preserve any unrelated real records. Confirm release inventory is empty. The release builder creates an empty inventory independently and must never copy development runtime data.
- Prepare/rebuild dist/ ZIPs only on explicit user request (see AGENTS.md). The existing ZIP deliberately predates the latest source changes.

## In-site tutorial — planned

- Add a brief guided tour focusing on the interface buttons.
- Highlight the current button and dim the rest of the page with a semitransparent overlay.
- Explain what each button does in one short sentence. Provide Next/Back and Skip/Close controls, and a way to replay the tutorial.
- Keep the tour keyboard accessible and usable on smaller screens; do not block normal use or automatically repeat it every visit.

## Later enhancements

- Optional structured deadlines and agent urgency recommendations, separate from manual urgency; agree the schema with Claude before implementation.
- Backup recovery UI and a safe update mechanism that preserves customized profile, settings and data.
- Consider a signed macOS application and Windows executable for a smoother first launch.
