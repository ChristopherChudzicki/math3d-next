# Legacy-scene migration audit

This checks that legacy math3d-react scenes migrate and display correctly in math3d-next before the math3d.org frontend cutover. It is temporary tooling: delete the code (listed below) a few months after the cutover. Keep this folder as the record of the method and results.

- Pass 1, rehydrated-vs-migrated comparison: [spec](2026-10-23-pass1-spec.md), [plan](2026-10-23-pass1-plan.md), [reports](reports/)
- Pass 2 (expression evaluation in both apps) and pass 3 (screenshots on a sample) are tracked in witan project `wp-verify-legacy-scene-migration-before-math3d-org--63f4d1`.

## Data

Every generated file is production scene data. Write it under the main checkout's `db-snapshots/legacy-audit/` (gitignored) with absolute paths, and never commit it. Committed reports contain aggregates only. A scene key grants access to an unlisted scene, so reports never include keys.

| File               | Written by                                               | One line per legacy scene, in `LegacyScene.id` order                                                                                     |
| ------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `legacy.jsonl`     | `export_legacy_audit`                                    | `{key, times_accessed, dehydrated, migrated: {items, item_order, title, creation_date} \| null, migrate_error: {type, message} \| null}` |
| `rehydrated.jsonl` | math3d-react `client/src/legacyAudit/rehydrate.audit.js` | `{key, mathGraphics, mathSymbols, folders, sortableTree, sliderValues, metadata, legacy_broken: [reason]}`                               |
| `findings.jsonl`   | `audit_legacy_migration`                                 | `{key, times_accessed, verdict, strict_clean, clusters, flags, mismatches, item_failures, order_failures}`                               |

`react_defaults.json` (math3d-react's `defaultSettings` per type, plus `initialState`) is code-derived, not user data. A copy is checked in at `webserver/scenes/legacy_audit/fixtures/`.

## Running pass 1

From the main checkout, with the local database loaded (`pull_scenes`):

```bash
D=$PWD/db-snapshots/legacy-audit; mkdir -p $D
cd webserver
IS_DEPLOYMENT=False DATABASE_URL=postgresql://docker:docker@localhost:5431/math3d uv run python manage.py export_legacy_audit --out $D/legacy.jsonl # pragma: allowlist secret
(cd ../../math3d-react/client && CI=true LEGACY_AUDIT_DEFAULTS_OUT=$D/react_defaults.json LEGACY_AUDIT_IN=$D/legacy.jsonl LEGACY_AUDIT_OUT=$D/rehydrated.jsonl npm test -- --watchAll=false --testMatch '<rootDir>/src/legacyAudit/**/*.audit.js')
IS_DEPLOYMENT=False uv run python manage.py audit_legacy_migration --legacy $D/legacy.jsonl --rehydrated $D/rehydrated.jsonl --defaults $D/react_defaults.json --out-dir $D/pass1
```

From a worktree, run the worktree's code on the host as shown, not through `docker compose run`, which runs the main checkout's code.

After a translator fix, re-run only `export_legacy_audit` and `audit_legacy_migration`. math3d-react's output doesn't change.

## Code to delete after the cutover

- `webserver/scenes/legacy_audit/`
- `webserver/scenes/management/commands/export_legacy_audit.py`
- `webserver/scenes/management/commands/audit_legacy_migration.py`
- math3d-react `client/src/legacyAudit/`
