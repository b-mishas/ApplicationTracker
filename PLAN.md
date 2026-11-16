# Application tracker — plan

[HISTORY.md](HISTORY.md) records completed milestones. [HANDOFF.md](HANDOFF.md) records verification and checkout status.

## Before shipping

1. **Verify the revised recipient guide visually.** Prerequisites, scheduled-task test order, Excel/PDF controls and optional export name are documented. Browser rendering remains unchecked: headless Chrome failed to launch during the 2026-11-11 documentation update.
2. **Review and publish release packages only when explicitly requested.** Build from pristine templates and audit both archives for an empty inventory, neutral settings and exclusion of personal and developer files. The five local development positions (`dev-mock-fit-1` through `dev-mock-fit-5`) remain outside both archives and should be removed from the local test inventory before a recipient rehearsal.
3. **Test a clean extraction on supported platforms.** Repeat the Windows x64 check and verify the Mac Intel archive on a real Mac. Test ARM64 only if those packages are later built and advertised. Check first-launch approvals, bookmark stability, Start reuse, explicit Restart/Stop, login startup enable/disable, sample import, workbook helper, desktop Excel and the browser's landscape PDF save dialog. Verify actual login on Windows and macOS; Windows shortcut execution alone does not establish login acceptance. Include Advanced port changes, occupied-port Restart protection and cancelling the startup port prompt.
4. **Rehearse one scheduled search in each supported assistant environment.** Confirm connector access, unattended folder permissions, import and visible results. Check that the hosted importer's `TZ` matches Part A across midnight.
5. **Ask a nontechnical recipient to try setup unaided.** Fix confusing instructions from extraction through the first search and export. Publish only when explicitly requested.

## Planned improvements

- **Draggable columns.** Column order can be shulffled by dragging (except the first 'expand' column). Current state is saved in `view-state.json`.
- **Resizeable columns.** Column width can be adjusted by dragging on column edges. Current state is saved in `view-state.json`.
- **In-app button tutorial.** Highlight one control at a time against a translucent overlay. Give each a one-sentence explanation and provide Next, Back, Skip and replay. Support keyboard use and narrow screens.
- **Version number in builds.** Take the version from package.json (now 0.1.0, shown nowhere) when building: put it into the ZIP names, a small version file in the package and the tracker's footer or Settings, so a recipient can say which build they run.
- **Template drift check.** Add a test that fails when agent/, guides/ or profile/ differ from their templates/ copies. The release ships templates/, so an edit to only one copy would silently ship stale instructions.
- **Later.** Backup recovery and updates that preserve local data, signed launchers, optional structured deadlines and agent urgency suggestions, and possible UK/GB normalization. Coordinate agent-facing schema changes with Claude.
