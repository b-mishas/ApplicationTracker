# Application tracker checkpoint

Updated 2026-11-11 02:35 UTC by Codex. Checkout C:/Users/misha/Claude/ApplicationTracker on main at 535dcea, matching the local origin/main ref. Remote and CI unverified for this turn. No background operations.

## Current local work

- app/app.js preserves a noncollapsed text selection intersecting the clicked row. It cancels the click’s default action and skips expansion so the table rebuild cannot erase the selection. Explicit buttons bypass the guard.
- Position links use draggable=false, and app/style.css explicitly enables text selection in data cells. Dragging selects the title, while an ordinary click follows its link. Expand and quick-action cells retain their native selection behavior.
- HISTORY.md records the verified behavior. These four files, including this handoff, are unstaged.

## Verification

Real pointer drags in headless Chrome and Firefox selected both linked and plain position names, preserved selection on expanded rows, and avoided expansion or link navigation on mouse-up. Ordinary row clicks, linked-title navigation, explicit plus/minus controls and quick actions passed. Job data stayed byte-identical until the intentional quick-action check.

Chrome also verified keyboard activation after selection. Firefox WebDriver key events reached the focused button but did not synthesize a click in the scratch harness, so native Firefox keyboard activation remains unconfirmed. Firefox explicit button activation passed. Syntax and diff whitespace checks passed. Physical-device acceptance was outside this pass.

## Previous features and next steps

535dcea contains D MMM YYYY table dates. 67dfb52 contains the In progress layout with Applied on, date sorting and restoration of the previous layout after leaving, reload or restart. See HISTORY.md for verification.

Review the local selection fix. See PLAN.md for the guide update, packaging on request, assistant rehearsals, supported-platform acceptance and recipient trial. The existing ZIP predates recent source changes.
