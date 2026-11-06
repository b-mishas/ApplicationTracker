# Application tracker checkpoint

Updated 2026-11-06 12:05 UTC by Codex for the tracker source commit on main. The commit is based on 4e13896, which matched GitHub origin/main before staging. CI is unverified. Claude's agent, profile and template edits are a separate follow-up.

## Current scope

The header groups Excel and PDF and places Settings at the far right. The JSON control has a descriptive tooltip. Settings adds an optional Name above the export language. The name is stored as exportName in local settings. Both exports append it after a hyphen to the localized title. Excel places the named title in a merged heading row above its column headers. PDF uses the existing A4 landscape report heading. Changes span the header and settings form, settings validation, both renderers, the Excel self-check, portable tests and project docs.

The editor auto-saves stage and outcome changes, preserves drafts, and shows milestone controls by stage. Save changes and Cancel enable only when dirty. Rejected hides the stored Offer date. Primary Status and interview outcome synchronize in both directions, with a legacy effective-status fallback. New, Shortlisted, Active and All presets share the column filter. Search and filters persist across reload and local server restart. The overview shows Urgent next to Shortlisted. Settings keeps the Excel language label. JSON drives group colours and country flags. Row markers are 3 px. READ ME.html has four copyable prompt boxes. Start Windows.cmd restarts the server for the current installation.

## Verification and next steps

npm test passed 57 importer cases, view-model, palette and API checks, and 14 portable integration checks. Tests cover saving and clearing the name, literal text, workbook title, filtering and frozen headers, and rejection of personalized release settings. Headless Chrome verified Settings at the right edge at 320, 390, 800 and 1280 px, the JSON tooltip text, name persistence after reload, and the named Excel and PDF exports. Chrome rendered the PDF as six A4 landscape pages. The native print dialog and desktop Excel were untested.

Keep Claude's agent/profile/template changes separate when staging. The existing ZIP predates source changes and is rebuilt only on request. Remove the five local dev mocks before shipping. The button tutorial and real macOS, Windows ARM64, scheduled-agent and recipient acceptance remain pending.
