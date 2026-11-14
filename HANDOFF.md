# Application tracker checkpoint

Updated 2026-11-14 20:56 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker. This snapshot accompanies the local-port Settings commit and its requested fast-forward merge from feature/port-settings into main. HEAD is the commit containing this snapshot (parent 9735f09); main tracks origin/main. Remote/CI unverified. No push or ZIP rebuild requested/performed. No test/build operations active; the normal tracker server remains running.

## Delivered behaviour

Settings → Advanced exposes a validated Local port and clickable current address. Revision-protected saves stage data/server-port.json for explicit Restart; the current server stays running and Cancel changes nothing. Occupied ports are rejected. Restart checks the requested address before stopping the server and attempts old-address recovery on a later startup failure. Start/Restart files offer replacement-port input or Enter to cancel; the installation lock is released while waiting. Login/background launches do not prompt. JOBTRACKER_PORT overrides are explained and disable editing. Export preferences and position schema remain unchanged.

The reported disabled input was traced to the old live server returning 404 for /api/port-settings. The page now displays explicit Restart/reload guidance for that case. The actual tracker was restarted at the same address; its endpoint returned 200 and inventory/export settings remained byte-for-byte unchanged. Settings now anchors its top edge with bounded height/internal scrolling, preventing movement when Advanced expands.

The commit includes API/helper/launcher/Settings changes, four Start/Restart files, focused tests, release file list and recipient/maintainer documentation. Existing archives remain stale. The discarded design sketch and compact expanded-field trial are not part of this feature.

## Verification and next action

Focused port/API/prompt and startup regressions passed, including actual Windows starters and isolated login registration. Existing API regressions passed. Chrome verified native keyboard editing, stale-server guidance, Save/Cancel, occupied-port rejection, pending values, stable heading/top on expand/collapse, desktop/390 px layouts and scrolling at 390×360; screenshots inspected. Final syntax/whitespace checks passed before committing. Functional tests were not repeated for the Git-only merge.

Actual OS login, macOS execution and rare post-probe recovery remain untested. Next: review the local main commit and perform recipient/platform acceptance. Push and distribution builds require explicit requests.
