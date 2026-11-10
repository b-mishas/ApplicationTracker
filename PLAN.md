# Application tracker — plan

[HISTORY.md](HISTORY.md) records completed milestones. [HANDOFF.md](HANDOFF.md) records verification and checkout status.

## Before shipping

1. **Update the recipient guide.** Bring [READ ME.html](<READ ME.html>) in line with the Excel/PDF controls and optional export name.
2. **Prepare the release ZIP only when explicitly requested.** The existing ZIP predates tracker commit `82dc7d3`. Remove the five local development positions (`dev-mock-fit-1` through `dev-mock-fit-5`) before shipping. Build from pristine templates, then audit the archive for an empty inventory, neutral settings and exclusion of personal and developer files.
3. **Test a clean extraction on supported platforms.** Repeat the Windows x64 check on the new ZIP. Verify real macOS (Intel and Apple silicon) and Windows ARM64 for any variants advertised as supported. Check first-launch approvals, Start/Stop/restart, sample import, workbook helper, desktop Excel and the browser's landscape PDF save dialog.
4. **Rehearse one scheduled search in each supported assistant environment.** Confirm connector access, unattended folder permissions, import and visible results. Check that the hosted importer's `TZ` matches Part A across midnight.
5. **Ask a nontechnical recipient to try setup unaided.** Fix confusing instructions from extraction through the first search and export. Publish only when explicitly requested.

## Planned improvements

- **In-app button tutorial.** Highlight one control at a time against a translucent overlay. Give each a one-sentence explanation and provide Next, Back, Skip and replay. Support keyboard use and narrow screens.
- **Template drift check.** Add a test that fails when agent/, guides/ or profile/ differ from their templates/ copies. The release ships templates/, so an edit to only one copy would silently ship stale instructions.
- **Later.** Backup recovery and updates that preserve local data, signed launchers, optional structured deadlines and agent urgency suggestions, and possible UK/GB normalization. Coordinate agent-facing schema changes with Claude.
