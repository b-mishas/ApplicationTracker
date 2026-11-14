# Application tracker checkpoint

Updated 2026-11-14 16:30 UTC by Claude. Checkout C:/Users/misha/Claude/ApplicationTracker, main at 729a21f, working tree clean before this file. Local origin/main ref is 7256534 (not fetched); remote/CI unverified. No operations active. Claude is not editing the checkout; Codex may.

## State

- d6d880e and 729a21f: routine Part B assigns models to subagents (Claude haiku/sonnet, Codex Luna/Terra), file-based result handoff, throttling after HTTP 429; setup prompt and Claude guide recommend Sonnet. agent/ and guides/ equal their templates/ copies. Never run in this form; the user will rehearse with Codex from the new ZIP.
- dist/Application-tracker.zip is from 2026-11-05 and stale. It is 158 MB (464 MB extracted); the four Node runtimes are 424 MB of that.
- Manual scheduled task `rehearsal-daily-job-search` still holds the old Part B. rehearsal/ is ignored locally.

## Next task for Codex: one ZIP per platform

The user decided (2026-11-14): build two deliverables for now, Windows x64 and macOS Intel, each with exactly one runtime. Keep the two ARM64 entries in runtime-manifest.json but do not build them by default (for example a default target list of `windows-x64, mac-intel`); points 1–5 below apply to the built targets only. The ARM64 starters' messages should then say that no package exists yet for that processor, or run the x64 runtime under emulation if Codex verifies that works (Rosetta 2 on Apple silicon, x64 emulation on Windows ARM64; both unverified here). Work on a branch (suggested `feature/per-platform-release`) in this checkout; a separate worktree would lack node_modules and .build-cache. Do not push or publish unless asked.

1. **scripts/build-release.mjs.** Build the shared content once (app files, node_modules, templates, notices, empty data, neutral settings). For each artifact in runtime-manifest.json write its own archive with only `runtime/<platform>-<arch>/`, only that OS's Start and Stop files, and RUNTIME_CHECKSUMS.json reduced to that artifact. Output names: `Application-tracker-windows-x64.zip`, `-windows-arm64.zip`, `-mac-intel.zip`, `-mac-apple-silicon.zip`, each with `.sha256`. Run the private-content check and auditRelease on every archive. Optional `--target` to build one. Delete the old `dist/Application-tracker.zip`.
2. **Starters (four files).** When the bundled runtime for the detected processor is missing, name the package the user needs (for example "This package is for Intel Macs; download the Apple silicon package") before any fallback to a global Node.
3. **scripts/test-release.mjs.** Extract and run the archive matching the host. For all four: audit, stale-app-file comparison, exactly one runtime folder, no starters of the other OS. Move the 0755 assertions for `Start (Mac).command` and the Mac `node` to the two Mac archives.
4. **scripts/audit-release.mjs.** The CLI default path points at the old single ZIP; audit all `dist/Application-tracker-*.zip` or require a path.
5. **Docs naming four bundled runtimes or one ZIP:** README.md (lines 7, 30), app/README.md:11, app/SEARCH_WORKFLOW.md:47, PORTABILITY.md, THIRD_PARTY_NOTICES.md, PLAN.md items 2–3. START_HERE.html line 46 lists both starters; either generate it per OS or keep it and accept one unused line.
6. **Optional, separate commit:** node_modules is most of the 7,254 files and ships source maps and duplicate exceljs builds. Trim only after checking what app/ loads at run time.

Untested: everything above; macOS and Windows ARM64 archives cannot be run on this Windows x64 host.
