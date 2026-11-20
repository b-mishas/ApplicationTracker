# Search recovery contract (version 1)

`run-state.mjs` maintains the live `run-completion.json`, finds unfinished work across run folders, and preserves import attempts. It complements [CANDIDATE_STATE.md](CANDIDATE_STATE.md). It does not browse, decide relevance, determine schedules from the profile, advance coverage dates or remove old evidence. Its summary command derives bookkeeping data; the agent writes the final narrative. The agent still follows the routine's work order and limits.

## Initialize before external work

From ROOT, using the compatible bundled Node:

```text
node app/run-state.mjs init --root data --run <run-id> --input <run-folder>/plan.json
node app/run-state.mjs read --root data --run <run-id>
node app/run-state.mjs next --root data --run <run-id>
```

`--root` is the inventory data folder (not installation ROOT); `--run` is its run-folder name, not a path. `--input` reads UTF-8 JSON, including BOM. The helper computes the SHA-256 revision of `../profile/candidate_profile.md` relative to data. Use the same data folder and Node/TZ as the importer. All run folders and snapshots must remain ordinary directories, not symlinks. Initialize an existing capture-only folder without overwriting its ledger; existing completion files, including legacy formats, are never overwritten by init.

Example plan input:

```json
{
  "scope": {"sources": ["Example", "Local bookkeeping"], "exclusions": []},
  "deadline": null,
  "tasks": [{
    "id": "employer:Example", "kind": "employer", "source": "Example",
    "status": "pending", "nextAction": "Read page 1", "reason": "", "evidence": "",
    "cursor": null, "calls": 0, "maxCalls": 15
  }]
}
```

Populate actual due work from the profile, workbook and coverage file; include the routine's seven completion categories and explicit not-due/excluded outcomes. `tasks: []` is allowed during early setup before due work is known; it does not prove completeness. Add tasks as the work list becomes known. Scope source labels must match task sources and captured candidates' source labels exactly. `sources: ["*"]` permits the profile's normal sources; it does not waive profile filters. For a scoped run prefer explicit labels, including a local-bookkeeping label for local tasks. Temporary exclusions are `{source, reason, expiresAt}`; `expiresAt: null` means this run's scope, not a permanent profile rule. Expiry triggers review, not automatic widening. Only record a deadline if the user or routine actually supplies one.

## Update tasks and context

```text
node app/run-state.mjs task --root data --run <run-id> --input <run-folder>/task-update.json
node app/run-state.mjs stop --root data --run <run-id> --input <run-folder>/stop.json
node app/run-state.mjs context --root data --run <run-id> --input <run-folder>/context.json
node app/run-state.mjs resume --root data --run <run-id> --input <run-folder>/context.json
```

Every update includes `revision` from the latest `read`. `task` takes `{revision, task}` with the complete task object. Kinds: alerts, posting, refresh, employer, portal, gap, recheck, import, coverage, summary. Statuses: pending, active, done, partial, deferred, failed, not_due, excluded. Done needs evidence; partial/deferred/failed/not_due/excluded need a reason. Unfinished tasks need nextAction. Cursor is null or a short continuation hint; use overlap/deduplication for mutable listings. Store full results in existing evidence files, not in task prose.

Save active state and current usage before potentially blocking work; update after each source/result batch. `calls` never decreases; task source, kind and maxCalls cannot be changed after creation. Active work is refused when the saved call limit is reached, the source is excluded, the profile changed, the deadline passed, an exclusion expired, or the run is stopped. The helper enforces declared state; it cannot count external calls itself, interrupt a blocked tool, or prove evidence is true. On the last permitted call, save active while usage is still below the limit, then record the consumed call and outcome. After a crash, conservatively account for a possibly consumed call before retrying.

`stop` takes `{revision, reason}` and still permits local evidence/task updates and reconciliation. It blocks new imports and active work. `context`/`resume` take `{revision, scope, deadline, reason}` and reread the actual profile revision. Use only within current user authorization, never to evade a limit. Context preserves a stop; resume explicitly clears it. Omitting deadline preserves it; use an explicit null only when clearing it is authorized. Profile changes require reassessing stale candidates; accepting a new context does not relabel old assessments as current. Within-run call budgets remain consumed; later scheduled runs have their own stated limits.

## Find and carry forward unfinished work

`next` scans all ordinary run folders and returns compact unfinished tasks, candidates needing assessment/delivery, unknown imports, context blockers and warnings. It does not print batch bodies or full old receipts. Resolved setup captures do not clutter the queue. Unsupported/corrupt legacy files and symlinks are warned about and preserved, not silently migrated or treated as complete.

Use the returned runId to read a candidate through the ledger helper or inspect an earlier manifest. Do not repeat equivalent external work before inspecting saved results. Carry a due task into today's plan explicitly, preserving its source/cursor and recording the reason; reuse old results only within current scope and profile. `allowedNow` means current scope/context permits consideration, not permission to ignore the routine's due order, source limits or old evidence. Reconcile old import attempts before retrying them. A fresh authorized run uses its own scope; old temporary restrictions never silently become permanent preferences.

## Prepare and execute tracked imports

Keep writing the normal schema-valid batch in `data/incoming/`. Then:

```text
node app/run-state.mjs prepare --root data --run <run-id> --input <run-folder>/mapping.json
node app/run-state.mjs import --root data --run <run-id> --input <run-folder>/import-request.json
node app/run-state.mjs reconcile --root data --run <run-id>
node app/run-state.mjs receipt --root data --run <run-id> --input <run-folder>/receipt-request.json
```

Prepare input: `{revision, batch: "YYYY-MM-DD-<run-id>.json", mapping: [{runId, id}, ...]}`. Map every batch position in order to one assessed candidate, which may be in an earlier setup/run ledger. IDs come from `candidate-ledger list`. Map an empty batch with `[]`. Candidate profile revisions must be current, sources permitted, and company/title/fit/basis and known requisition identity must match. The agent still supplies the full import payload and judges ambiguous identities. New batch runId must match the owning manifest; the existing importer validates the filename and all remaining schema/cross-field rules.

Prepare atomically saves the full batch text, digest and mapping inside the manifest. It never writes inventory. Repeated preparation of identical bytes/mapping returns the same importId. A changed batch is a new snapshot, preserving earlier attempts and evidence.

Import input: `{importId}`. The helper writes/validates a snapshot under the run folder, saves an intent before calling `importBatch`, then saves its full result as a receipt. It delegates inventory locking, backups, validation and user-field preservation to the existing importer. It permits valid siblings of a partially valid batch. Input-file changes after preparation cannot alter the snapshot. Run imports serially through this helper; do not also run the same batch through the old direct CLI, which cannot create these receipts. CLI import returns the importer's exit code (0, 2, 3, 4 or 5); helper errors exit 1.

`receipt` input is `{importId, attemptId?}`; omit attemptId for the latest. Read full outcomes only when needed. A confirmed successful attempt is returned without reimporting on a repeated import call. Older attempts are never replaced. Delivery is computed from successful per-index receipts and the saved candidate fingerprint; assessment/disposition changes invalidate that prior fingerprint. New profile revisions invalidate old assessments even if inventory delivery previously succeeded.

### Interrupted and partial imports

`reconcile` can recover the latest missing receipt from a changed matching importer report whose batch hash and timestamp agree with the saved intent. A later attempt's report never fills an earlier missing receipt. A missing report does not mean no inventory change: the importer commits before reporting. Such attempts remain explicitly unknown, including original added/updated counts.

Inspect unknown outcomes first. If an idempotent retry is justified, use `{importId, retryReason, allowUnknown: true}`. Known transient failures also require retryReason, but no unknown override. This is an agent decision within existing authorization, not a new user-approval requirement. Ambiguous/rejected receipts cannot be blindly retried: repair confidently, prepare the corrected batch as a new snapshot, then import it. Already accepted records still use the existing importer's idempotent merge. An original unknown remains unknown even when a later retry succeeds.

Archive the original incoming batch only under the existing workflow conditions: a successful report for those exact bytes, no unresolved record outcomes and no report-write error. The helper does not move/archive files. Immutable snapshots/receipts remain available after archival. Older unsupported batches still follow the original importer workflow; do not invent mappings or historical outcomes merely to adopt them.

## Safety and retention

Run-state writes use the existing atomic JSON writer and an exclusive per-run `run-state.lock` directory. Never steal a stale lock or remove one while a writer may be active. Use one lead writer for ledger/manifest/import operations; subagents return result files only. A process killed during an operation may leave a lock/snapshot requiring deliberate inspection. Atomic file replacement is not a promise of power-loss-proof transactions across inventory and receipts.

All run folders remain retained. This deliberately protects old pending candidates, unknown outcomes, legacy evidence and cross-run receipt references. `next` reports `retention: preserve`; no automatic deletion command exists. Safe destructive pruning is deferred until dependency-aware retention is separately implemented. No source check date is advanced by this helper.



## Derived summary

Run `node app/run-state.mjs summary --root data --run <run-id>` before writing the final summary. Use its candidate dispositions, task statuses, unique confirmed import outcomes and outstanding work instead of manually recounting them. Import counts describe this run receipts; candidate totals describe this run ledger, so older captured candidates imported today belong to different totals. Unknown attempts remain explicit even after successful retries. Task completion is declared evidence, not proof of full source coverage. For metrics absent from saved evidence, report "unknown: not recorded", never an invented zero. Preserve the existing narrative sections and cite source evidence for coverage claims.

The command is read-only and returns JSON for the agent to format. It does not mark the run complete or advance coverage dates. Confirmed import outcomes count each candidate identity once, retaining the first successful outcome across retries; ambiguous/rejected outcomes can be superseded by later confirmed success. Cross-run pending work and warnings remain in the output. Use a single lead writer and query between updates.

`imports.originalCounts` is null whenever any original attempt lacks a receipt. Confirmed unique candidate outcomes remain available separately; they are not operation totals or proof of zero additions. Task status counters include explicit zeros; pending/active work remains visible. Legacy imports lacking mappings are outside these totals and require separate reporting.
