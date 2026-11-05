# Application tracker — tracker and agent tools

The visible tracker is Application tracker. The importer command and JSON fields keep the original integration contract.

Open the operating-system Start file in the parent folder. It initializes missing folders, starts a local server and opens the browser. Use the same starter again to reopen it. Settings are available in the page header. For first-launch troubleshooting, read ../READ ME.html and data/logs/server.log.

From the installation root:

    node app/self-check.mjs
    node app/self-check.mjs --require-configured

Node here means an available compatible Node executable; the release includes runtime/win-x64/node.exe, runtime/win-arm64/node.exe, runtime/darwin-x64/node and runtime/darwin-arm64/node. Quote paths containing spaces. Linux agent environments need their own Linux Node; host executables cannot run there. No private Codex/Claude runtime, Python or package installation is needed.

See SEARCH_WORKFLOW.md for exact settings, import, employer-workbook and export commands. On a new installation, Settings intentionally starts with no groups/countries and no timezone. Complete it before importing real discoveries. The installation self-check passes with a notice before personalization; --require-configured makes incomplete personalization a failure.
