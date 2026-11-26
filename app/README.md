# Application tracker — tracker and agent tools

The visible tracker is Application tracker. The importer command and JSON fields keep the original integration contract.

Open the operating-system Start file in the parent folder. It initializes missing folders, starts a local server and opens the browser. Use the same starter again to reopen it. Settings are available in the page header. For first-launch troubleshooting, read ../START_HERE.html and data/logs/server.log.

From the installation root:

    node app/self-check.mjs

Node here means an available compatible Node executable. The Windows x64 release includes runtime/win-x64/node.exe; the Mac Intel release includes runtime/darwin-x64/node and the Mac Apple silicon release runtime/darwin-arm64/node. Quote paths containing spaces. Linux agent environments need their own Linux Node; host executables cannot run there. No private Codex/Claude runtime, Python or package installation is needed.

See SEARCH_WORKFLOW.md for exact settings, import, employer-workbook and export commands. Settings contains only Excel export language. Groups/countries come from position JSON and dates use local computer time. No tracker search configuration is required before importing. The old --require-configured self-check option is accepted as a compatibility alias.

Drag a column heading label to reorder columns; the expand column stays first. Alternatively, focus a heading and press Alt+Left/Right. Column order, visibility and sorting are saved in data/view-state.json; each named preset remembers its own column visibility, order, widths and sorting. Moving columns preserves unsaved expanded-row edits.

Drag a heading’s right edge to resize its column. Double-click the edge to restore automatic sizing. For keyboard use, focus the edge handle: Left/Right changes width by 10 px (Shift: 50 px), Home restores automatic sizing, and Escape cancels an ongoing drag. Widths save with the view layout, remain attached to moved/hidden columns and preserve unsaved expanded-row edits. Untouched columns share spare space; manually sized columns keep their width.

Preset defaults: All positions uses the standard nine columns. New adds First found; Shortlisted and Urgent add Posted at the end. Applied keeps Actions and adds Applied on at the end; Applications sent replaces Actions with Applied on. Interview invites and Offers received also add Last interview after Applied on. Last interview reads the existing interview date, falling back to the latest legacy Interview history entry; a cleared date stays empty. It supports date filtering and sorting. Older shared layouts are retained for custom filter combinations; named presets initially use these defaults.

## Correct an entry

Expand a position and choose **Edit**. Row fields and the three detail columns form one draft: correct vacancy details, assessment, countries, dates and source links, then **Save** or **Cancel**. Group accepts your own text. Additional fields are collapsed; IDs, import timestamps and historical status records remain read-only. Source evidence filenames are hidden and preserved. **Primary** chooses the title's link; unfamiliar changed URLs require a Link type choice.

Normal-view Status actions still save immediately. In full Edit mode, status and date changes wait for Save with the rest of the draft. Undo restores that whole saved edit. Enter saves from text controls, Shift+Enter adds a newline, and Escape cancels; buttons/selects retain their normal Enter behavior. A stale save keeps the draft visible with an error.

These corrections use the existing inventory format. Later discovery refreshes can update assessment and vacancy fields under the existing merge rules; this feature does not lock manual corrections against future imports. Restart the server and reload the page after installing this update.

## Smaller windows

Automatic columns shrink before horizontal scrolling begins, with whole-pixel allocation and a stable scrollbar gutter to avoid fractional-width flicker on scaled displays; manually resized columns keep their chosen width. Widening the window restores the automatic sizing without changing saved layouts. At 1600 px and below, spacing tightens and Statistics labels shorten to All, Sent, Invites and Offers, with full-title hover hints over the entire preset button, including its count. Drag the navigation panel’s right edge left for short labels or right for full titles. Double-click toggles short/full labels. Left/Right selects short/full labels; Home restores automatic mode. The label mode is remembered in this browser, separately from column preferences. Narrowing the window below 1600 px releases a manual full-label choice back to automatic sizing, so labels shorten before the panel collapses.

At 1150 px and below, navigation becomes a 44 px rail showing New, List (Shortlisted) and Applied counts, plus a reserved 10 px spacer (54 px total). The three-dot control is hidden and disabled while collapsed, and returns when navigation opens. Hovering the outlined rail opens it over the results; hovering the three-dot strip alone does not. Keyboard focus also opens it; clicking the rail pins/unpins it. Pinning reserves navigation space. Below 1600 px, full labels use space the table can spare and then wrap inside the reserved panel width. Pinned navigation never covers entries; only temporary unpinned hover/focus expansion overlays results. The 10 px three-dot strip follows the separator and ends directly at the results, with no CSS gap. Escape unpins and closes it. Pin state lasts for the current page session. Very narrow screens or wide custom columns can still require table scrolling; no columns are automatically hidden.

The rail leaves 24 px between the menu symbol and New. Its Applied count matches the sidebar Applied view: Applied, Interview and Offer positions. Counts refresh after saved edits.
