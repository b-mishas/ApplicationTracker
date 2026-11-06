# Portable package contract

See app/SEARCH_WORKFLOW.md for implemented interfaces, PLAN.md for remaining work and design questions, HISTORY.md for verified milestones, and HANDOFF.md for current operational state. INTERFACE_FOR_TRACKER.md records the shared agent/tracker contract.

The package uses app/, data/, settings/, agent/, profile/, guides/ and bundled runtime/. The browser product is Application tracker and the repository is b-mishas/ApplicationTracker; the importer command, JSON fields, flags and exit codes keep the original integration contract. Import envelope/fields/flags/exit codes are preserved; groups come from position JSON and country codes are checked against the bundled catalogue, independently of search preferences. Calendar dates follow the importing computer’s local time; hosted agents use their own TZ environment to match the scheduled timezone. Manual urgency remains user-owned; automated deadline fields are a later coordinated extension.

The distribution builder takes pristine templates rather than runtime/profile state, bundles pinned dependencies and four checksummed official Node runtimes, excludes Git/developer/private content, and produces one ZIP plus a checksum. Repeat initialization preserves user data. Windows and macOS starters are supplied; real macOS acceptance and any unsigned-launch approval experience must be recorded honestly before claiming full platform validation.

Node licensing/notices and dependency licenses are retained. A macOS command launcher may require first-launch approval; a signed application is a later enhancement. No cloud service is required for the tracker itself. Scheduled search needs an appropriate LLM app/account, folder access, Node in its actual execution environment and the intended connectors.
