# Legacy-scene migration audit

This checks that legacy math3d-react scenes migrate and display correctly in math3d-next before the math3d.org frontend cutover. It is temporary tooling: delete the code (listed below) a few months after the cutover. Keep this folder as the record of the method and results.

- Pass 1, rehydrated-vs-migrated comparison: [spec](2026-10-23-pass1-spec.md), [reports](reports/)
- Pass 2, expression evaluation in both apps: [spec](2026-10-29-pass2-spec.md), [reports](reports/)
- Pass 3 (screenshots on a sample) is tracked in witan project `wp-verify-legacy-scene-migration-before-math3d-org--63f4d1`.

## Data

Every generated file is production scene data. Write it under the main checkout's `db-snapshots/legacy-audit/` (gitignored) with absolute paths, and never commit it. Committed reports contain aggregates only. A scene key grants access to an unlisted scene, so reports never include keys.

| File                       | Written by                                                   | One line per legacy scene, in `LegacyScene.id` order                                                                                                          |
| -------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy.jsonl`             | `export_legacy_audit`                                        | `{key, times_accessed, dehydrated, migrated: {items, item_order, title, creation_date} \| null, migrate_error: {type, message} \| null}`                      |
| `rehydrated.jsonl`         | math3d-react `client/src/legacyAudit/rehydrate.audit.js`     | `{key, mathGraphics, mathSymbols, folders, sortableTree, sliderValues, metadata, legacy_broken: [reason]}`                                                    |
| `pass1/findings.jsonl`     | `audit_legacy_migration`                                     | `{key, times_accessed, verdict, strict_clean, clusters, flags, mismatches, item_failures, order_failures}`                                                    |
| `pass1/manual_checks.json` | `audit_legacy_migration`                                     | Not per scene: `{hidden_by_blank_visibility: [{rank, key, items}]}`: among the 100 most-viewed scenes, those a policy changes; see below                      |
| `pass2/eval_next.jsonl`    | math3d-next `packages/legacy-audit/src/evaluateNext.spec.ts` | `{version: 2, key, crashed, items: {<itemId>: {<field>: {status, message?, value?, elements?, deps, features}}}}`                                             |
| `pass2/eval_react.jsonl`   | math3d-react `client/src/legacyAudit/evaluate.audit.js`      | The same, without `elements` and `features`                                                                                                                   |
| `pass2/replay_<c>.jsonl`   | math3d-next `evaluateNext.spec.ts` with a convention         | Only the scenes that use convention `<c>`'s triggers: the `eval_next` record plus `convention`                                                                |
| `pass2/findings.jsonl`     | `audit_legacy_evaluation`                                    | `{key, times_accessed, pass1_verdict, verdict, strict_clean, verified_clean, clusters, pairs: [every non-equal pair]}`, or `{…, verdict: "excluded", reason}` |
| `pass2/examples.json`      | `audit_legacy_evaluation`                                    | Not per scene: the most-viewed keys of each cluster, for filing tasks                                                                                         |

`react_defaults.json` (math3d-react's `defaultSettings` per type, plus `initialState`) is code-derived, not user data. A copy is checked in at `webserver/scenes/legacy_audit/fixtures/`.

## Running pass 1

From the main checkout, with the local database loaded (`pull_scenes`):

```bash
D=$PWD/db-snapshots/legacy-audit; mkdir -p $D
cd webserver
IS_DEPLOYMENT=False DATABASE_URL=postgresql://docker:docker@localhost:5431/math3d uv run python manage.py export_legacy_audit --out $D/legacy.jsonl # pragma: allowlist secret
(cd ../../math3d-react/client && CI=true LEGACY_AUDIT_DEFAULTS_OUT=$D/react_defaults.json LEGACY_AUDIT_IN=$D/legacy.jsonl LEGACY_AUDIT_OUT=$D/rehydrated.jsonl npm test -- --watchAll=false --testMatch '<rootDir>/src/legacyAudit/**/*.audit.js')
IS_DEPLOYMENT=False uv run python manage.py audit_legacy_migration --legacy $D/legacy.jsonl --rehydrated $D/rehydrated.jsonl --defaults $D/react_defaults.json --out-dir $D/pass1 --meta "Snapshot=prod, pulled <date>" --meta "math3d-next=$(git rev-parse --short HEAD)" --meta "math3d-react=<commit>"
```

From a worktree, run the worktree's code on the host as shown, not through `docker compose run`, which runs the main checkout's code.

After a translator fix, re-run only `export_legacy_audit` and `audit_legacy_migration`. math3d-react's output doesn't change.

## Running pass 2

Pass 2 needs pass 1's `legacy.jsonl`, `rehydrated.jsonl` and `pass1/findings.jsonl` from the same export, and math3d-react on branch `legacy-audit/rehydrate` (point `../math3d-react` at its worktree if that branch is checked out elsewhere). From the main checkout:

```bash
D=$PWD/db-snapshots/legacy-audit; mkdir -p $D/pass2
(cd packages/legacy-audit && LEGACY_EVAL_NEXT_IN=$D/legacy.jsonl LEGACY_EVAL_NEXT_OUT=$D/pass2/eval_next.jsonl yarn vitest --run src/evaluateNext.spec.ts)
(cd ../math3d-react/client && CI=true LEGACY_EVAL_IN=$D/rehydrated.jsonl LEGACY_EVAL_OUT=$D/pass2/eval_react.jsonl LEGACY_SAMPLE_POINTS=$OLDPWD/packages/legacy-audit/sample_points.json npm test -- --watchAll=false --testMatch '<rootDir>/src/legacyAudit/evaluate.audit.js')
cd webserver
IS_DEPLOYMENT=False uv run python manage.py audit_legacy_evaluation --legacy $D/legacy.jsonl --rehydrated $D/rehydrated.jsonl --pass1 $D/pass1/findings.jsonl --react $D/pass2/eval_react.jsonl --next $D/pass2/eval_next.jsonl --out-dir $D/pass2 --meta "Snapshot=prod, pulled <date>" --meta "math3d-next=$(git rev-parse --short HEAD)" --meta "math3d-react=<commit>"
```

Each evaluator takes about 15 minutes, and the join about 4. After a translator fix, re-run `export_legacy_audit`, `audit_legacy_migration`, math3d-next's evaluator, the replays and the join; math3d-react's output doesn't change. After writing the report, `audit_legacy_evaluation` exits non-zero if a field either evaluator emits has no pairing and no known reason to be unpaired: add it to the expected table or to `KNOWN_UNPAIRED` (`legacy_audit/evaluation.py`).

The command writes each report's tables; its Findings section (hypotheses confirmed or refuted, what the clusters are) is written by hand.

Accepted differences go in `legacy_audit/pass2_allowlist.py`, each citing app code or an owner decision. Before trusting a change to either fingerprint, run math3d-react's conformance check (`client/src/legacyAudit/README.md`).

A library convention the owner accepts (react's `round`, complex.js 2.0.4's addition) is accepted per pair instead. Replay math3d-next with that convention swapped in and pass the replay to the join, which accepts a `differ` pair when the replay gives math3d-react's value. A convention is a `CONVENTIONS` entry in `packages/legacy-audit/src/conventions.ts` plus a `REPLAYS` reason under the same key. The `round` replay takes about 7 minutes, `complex_add` about 13:

```bash
(cd packages/legacy-audit && for c in round complex_add; do LEGACY_EVAL_NEXT_CONVENTION=$c LEGACY_EVAL_NEXT_IN=$D/legacy.jsonl LEGACY_EVAL_NEXT_OUT=$D/pass2/replay_$c.jsonl yarn vitest --run src/evaluateNext.spec.ts; done)
# then add to audit_legacy_evaluation: --replay $D/pass2/replay_round.jsonl --replay $D/pass2/replay_complex_add.jsonl
```

## Manual checks

A blank calculated visibility keeps the author's `visible`, so math3d-next hides items that math3d-react showed on load (usually the `yz`/`zx` grids). `manual_checks.json` lists the affected scenes among the 100 most-viewed, with the items. For each one, open the scene in math3d-react (`math3d.org/<key>`) and in a local math3d-next (`/<key>`), and check that hiding those items looks right. The local backend must run this branch, since it re-translates a legacy scene on every GET, and the frontend must include #1403 (grid `zIndex`). The keys stay in `db-snapshots/`; don't paste them anywhere public.

## Code to delete after the cutover

- `webserver/scenes/legacy_audit/`
- `webserver/scenes/management/commands/export_legacy_audit.py`
- `webserver/scenes/management/commands/audit_legacy_migration.py`
- `webserver/scenes/management/commands/audit_legacy_evaluation.py`
- `packages/legacy-audit/`
- math3d-react `client/src/legacyAudit/`
