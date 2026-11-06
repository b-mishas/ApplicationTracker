# Application tracker — tracker and agent tools

The visible tracker is Application tracker. The importer command and JSON fields keep the original integration contract.

Open the operating-system Start file in the parent folder. It initializes missing folders, starts a local server and opens the browser. Use the same starter again to reopen it. Settings are available in the page header. For first-launch troubleshooting, read ../READ ME.html and data/logs/server.log.

From the installation root:

    node app/self-check.mjs

Node here means an available compatible Node executable; the release includes runtime/win-x64/node.exe, runtime/win-arm64/node.exe, runtime/darwin-x64/node and runtime/darwin-arm64/node. Quote paths containing spaces. Linux agent environments need their own Linux Node; host executables cannot run there. No private Codex/Claude runtime, Python or package installation is needed.

See SEARCH_WORKFLOW.md for exact settings, import, employer-workbook and export commands. Settings contains only Excel export language. Groups/countries come from position JSON and dates use local computer time. No tracker search configuration is required before importing. The old --require-configured self-check option is accepted as a compatibility alias.
