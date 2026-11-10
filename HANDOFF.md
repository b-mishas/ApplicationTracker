# Application tracker checkpoint

Updated 2026-11-10 09:27 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main, tracking origin/main. Latest source commit is `85be9ae`, followed by this documentation checkpoint. Remote and CI unverified at the time of writing. No background operations.

## Latest source changes

- `85be9ae` accepts UTF-8 BOM input in the settings and employer workbook commands, documents the PowerShell timezone workaround, and fixes Windows runtime packaging. The builder uses system tar for Mac archives and preserves a locked checkout executable while using the pinned runtime for the ZIP.
- `5464936` clears urgency when either dismissal control saves. Undo restores the prior status and urgency. Ordinary Restore keeps urgency cleared.
- `132ff2a` adds one-step Undo using the existing revision checks, backups and atomic writes. The curved-arrow button sits to the left of the export group. Grey feedback clears after one second without shifting the layout. Reload clears the tab's token.

## Verification

`npm test` passed 57 importer cases, 15 portable checks, and the view-model, palette and API checks on 2026-11-10. Earlier Git Bash scratch checks covered all four runtime archives and the Windows executable lock. Headless Chrome verified Undo and both dismissal paths, including the Urgent count. The existing distribution ZIP predates these source changes.

## Agent rehearsal and next steps

Claude’s two fictional Windows rehearsals exercised Gmail, importing, reports, coverage and workbook updates. The second run used a clean scratch build under Git Bash, verified TZ in PowerShell, and imported the three carried-over UK/CH candidates. Genmab and jobvector coverage remained unfinished. Agent follow-up is in `cf9b3ad`.

See PLAN.md for the guide update, release packaging, scheduled Cowork/Codex tests, real macOS and Windows ARM64 tests, and recipient acceptance. The old JobTracker app preset remains an app-side follow-up.
