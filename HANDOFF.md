# Application tracker checkpoint

Updated 2026-11-14 15:43 UTC by Codex. Checkout: `C:/Users/misha/Claude/ApplicationTracker`, branch `feature/per-platform-release`, HEAD `4da05bc` before this handoff commit. This branch has no upstream; local `main` is `3df5319`. Remote and CI state were not checked. No operations are active.

## Current release state

The default `npm run build` produces `dist/Application-tracker-windows-x64.zip` (47,058,433 bytes) and `dist/Application-tracker-mac-intel.zip` (52,768,267 bytes), each with a `.sha256` file. The old `Application-tracker.zip` and its checksum were deleted. Each new archive contains one official pinned Node runtime, its matching Start/Stop files, and a `RUNTIME_CHECKSUMS.json` with one entry. Shared app, dependency and pristine-template content is read once by the builder. The two ARM64 entries remain in `scripts/runtime-manifest.json`; explicit `--target` builds remain possible, but default builds omit them. ARM64 starters report that no package exists yet because Rosetta and Windows ARM x64 emulation were not verified.

## Changed files and verification

- `scripts/build-release.mjs`, `scripts/audit-release.mjs`, `scripts/test-release.mjs`: per-platform builds, explicit audit path, archive structure/checksum checks and extracted host testing. The four Start/Stop files select their bundled runtime and give processor-specific missing-package messages.
- `README.md`, `app/README.md`, `app/SEARCH_WORKFLOW.md`, `PORTABILITY.md`, `THIRD_PARTY_NOTICES.md`, `PLAN.md`: describe the two default packages. `HISTORY.md` records verified results. With the user's explicit exception, `app/test-portable.mjs` no longer sets a manual status override in its generated-history fixture.
- `npm run build` passed both in-build audits: `textFiles: 5455`, `workbooks: 1`, `ok: true` for each. Both standalone audit commands passed. `node scripts/test-release.mjs` passed static checks for both archives and Windows x64 extraction, Start/Stop, repeat launch, empty inventory, self-check and Excel download. `npm test` passed `57/57` importer cases and `15 portable integration checks` after the fixture correction.

## Open checks and next action

Mac Intel execution, first-launch permissions, and desktop Excel/PDF acceptance require a real Mac or recipient test. ARM64 runtime execution and emulation remain untested. `START_HERE.html` still lists both starter names, as allowed by the task. `INTERFACE_FOR_TRACKER.md` still describes the former combined ZIP and four bundled runtimes; it was outside the permitted edit list. Review the branch and test on a real Intel Mac before publishing. Nothing was pushed or published.
