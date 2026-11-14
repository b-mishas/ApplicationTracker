# Application tracker checkpoint

Updated 2026-11-14 16:12 UTC by Codex. Checkout: `C:/Users/misha/Claude/ApplicationTracker`, branch `feature/per-platform-release`. Source commit/HEAD `39e15fe` and upstream `origin/feature/per-platform-release` matched the remote SHA after the push (`git ls-remote`). Local `main` is `3df5319`. CI is unverified; no operations are active.

## Release state

The committed builder has a working `--target` flag for `windows-x64`, `windows-arm64`, `mac-intel` and `mac-apple-silicon`. Default `npm run build` produces the Windows x64 and Mac Intel ZIPs only. Each contains one pinned Node runtime, its platform's Start/Stop files and one runtime checksum entry. ARM64 entries remain in `scripts/runtime-manifest.json` but are not built by default. ARM64 starters say that no package exists yet, since emulation has not been verified.

The last built `dist/` ZIPs are 47,058,433 bytes (Windows x64) and 52,768,267 bytes (Mac Intel), each with `.sha256`. They predate the Stop renames and still contain `Stop Windows.cmd` and `Stop macOS.command`. Their guide lists both starters, matching the restored source guide. The old combined ZIP was removed earlier. Do not treat the current ZIPs as matching the source checkout.

## Latest source edits and verification

- Renamed the source Stop files to `Stop (Windows).cmd` and `Stop (Mac).command`; updated `scripts/build-release.mjs` and `scripts/test-release.mjs` references. The Start filenames remain `Start (Windows).cmd` and `Start (Mac).command` for clarity in the shared source checkout.
- `START_HERE.html` retains the explicit Windows and Mac starter names after user review; its experimental generic wording was reverted. `README.md` lists all four accepted `--target` values. `HISTORY.md` records this source milestone.
- `node --check` passed for both changed scripts; `git diff --check` passed after cleaning the README target list. A focused check passed for all four launcher files and build/test references; `START_HERE.html` matches its committed wording. No ZIP rebuild or release extraction test was run for these latest edits.

Before these edits, both ZIPs passed release audits and `scripts/test-release.mjs` on Windows x64; `npm test` passed 57/57 importer cases and 15 portable integration checks. Those results apply to the earlier ZIP contents.

## Next action and limits

Rebuild both ZIPs only on explicit request, then rerun the release audit and extraction test. Test Mac Intel execution and first-launch permissions on a real Mac before publishing. ARM64 execution/emulation remains untested. `INTERFACE_FOR_TRACKER.md` still describes the former combined ZIP and was outside the prior permitted edit scope. No merge or publication was requested.
