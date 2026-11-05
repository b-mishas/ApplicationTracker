# Application tracker — plan

The source repository is ApplicationTracker; the visible product is Application tracker. See HISTORY.md for completed steps and HANDOFF.md for the current session snapshot.

## Delivery milestone

Completed in the working tree: configurable settings; no-write validation; installation self-check; portable Excel and employer helpers; reconciled agent documentation; bundled runtimes and platform starters; one-file ZIP; Windows clean-extraction/repeat-start tests. See HISTORY.md for verification.

Remaining acceptance work:
- Test first launch, approval prompts, importer, workbook helper, export and stop/restart on a real Mac (Intel and/or Apple silicon). Inspect launch guidance against the observed experience.
- Test Windows ARM64 on actual hardware; only Windows x64 execution has been verified here. All four runtime archives are checksummed and Mac executable ZIP permissions are verified.
- Run the complete personalized agent setup and one scheduled search with each intended LLM environment. Packaging tests do not establish connector availability or unattended permissions.
- Have a nontechnical recipient try the complete setup and correct any confusing instructions.
- Complete Claude's separate agent/template commit; Codex tracker changes are committed/pushed. Publish a release when explicitly requested.

## Tracks and colour design — follow-up

Two product options to compare before implementation:

1. **Fit only (simpler option):** always colour the Fit column; leave Track/Group uncoloured. Remove the toolbar Colour mode selector because there is no longer a mode to choose. Group filtering remains a separate function. This avoids palette limits and colour competition when a user has many tracks.
2. **Fit plus configurable group colours:** retain simultaneous fit/group colouring and develop the stable palette/custom-colour controls below.

These are design alternatives, not a request to change the current interface yet.

- Support any practical number of application tracks through the editable groups list; no domain-specific fixed list.
- Keep a group's colour stable across sorting, filtering and adding/removing other groups.
- Offer a distinct curated palette for the first tracks and generate additional colours with adequate contrast. For larger lists, use labels as the primary identifier: colours alone cannot uniquely communicate an unlimited number of categories.
- Add optional per-group colour overrides and a reset-to-default control. Store colours in settings rather than job records; preserve them on rename where possible.
- Check simultaneously displayed fit/group colours, colour-vision accessibility and light/dark text contrast. Avoid neighbouring colours that look identical.

## Geography — follow-up

- Countries are configurable and must not be limited to the original user's region. Bundle local SVG flags for supported country/territory codes, with readable labels.
- Add a searchable country picker showing country names and codes rather than requiring memorized codes. Keep importing historical codes safe when the selected search geography changes.
- Keep search eligibility (remote restrictions, work authorization, relocation) in the candidate profile; a country selection alone does not establish eligibility.
- Consider multi-region search presets, localized country names and UK/GB normalization with a compatible migration.

## Later enhancements

- Optional structured deadlines and agent urgency recommendations, separate from manual urgency; agree the schema with Claude before implementation.
- Backup recovery UI and a safe update mechanism that preserves customized profile, settings and data.
- Consider a signed macOS application and Windows executable for a smoother first launch.
