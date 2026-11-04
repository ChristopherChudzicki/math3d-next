# Seed scenes

Scenes committed as JSON and loaded into any database by key. `qa/` holds one
scene per graphical feature for checking the renderers against each other;
`examples/` holds the Examples list.

## Short version

- `./manage.py load_seed_scenes` upserts `qa/*.json` and `examples/*.json` by
  `key`; `seed_test_data` calls it, so CI and a fresh dev database have them.
- From a worktree: `scripts/manage_worktree.sh load_seed_scenes`.
- In production, `heroku run ./manage.py load_seed_scenes` after a deploy that
  changes these files. It is not in the `release:` phase, so a refused load
  can never block a deploy.
- Open a scene at `http://math3d.localhost:3000/<key>`. Once a second renderer
  exists, the same key in two tabs with different `?renderer=` is the
  side-by-side comparison.

## File format

The public scene API's shape plus `key`; `dump_seed_scene` writes the keys in
this order:

```json
{ "key": "qa_points_JdnA", "title": "QA: points", "items": [...], "itemOrder": {...} }
```

An example adds `"example": { "position": 40 }`, its place in the Examples
list. No primary keys, authors or timestamps; unknown keys are rejected.
Prettier formats the files (pre-commit hook), so run
`prek run prettier --all-files` after writing one by hand.

The loader refuses a key that belongs to a user's scene, and takes over a
legacy scene: the file becomes its content, it stops being legacy, and
`GET /v1/scenes/{key}/` no longer re-translates it. QA keys are
`qa_<feature>_<4 chars from KEY_ALPHABET>`, e.g. `qa_points_JdnA`; the random
tail keeps clear of legacy keys, so a QA scene never takes one over. A tail:

```bash
uv run ./manage.py shell -c "from scenes.models import _random_key; print(_random_key(4))"
```

## Authoring or updating a scene

1. Build it in the app and save (for an existing seed scene, "Save a copy":
   seed scenes have no author, so the app refuses in-place edits).
2. `curl -s http://localhost:8000/v1/scenes/<saved key>/ | jq '{key: "<key>", title, items, itemOrder}' > webserver/scenes/seed_scenes/qa/<key>.json`
   (for an example, add `example: {position: <n>}` to the `jq` object).
3. `scripts/manage_worktree.sh load_seed_scenes`, then delete the stray copy in
   the app. `pytest scenes/seed_scenes_test.py` round-trips every file through
   the loader and the model validators.

Every QA scene with translucency should overlap two or more translucent
objects, so the difference between sorted blending and order-independent
transparency is visible rather than inferred.

A Django migration that rewrites `items` must re-dump every seed file (load,
migrate, curl, commit), or the round-trip test fails.

## Examples

Example scenes have no author (the loader refuses one that has), so editing an
example means editing its file. Reordering is editing `position`: a load
rewrites the example rows of every scene it loads, so swaps are fine. A file
without `example` drops its scene from the list; deleting a file leaves the
scene in the list, so remove it in the admin. The loader stops on a position
that two examples claim: two seed files, or a seed file and an example that
has none (move or remove that one in the admin).

Exporting the current production list, from a shell with access to it:

```bash
set -o pipefail
API=https://<the production API origin>
mkdir -p webserver/scenes/seed_scenes/examples
curl -s "$API/v1/examples/scenes/?limit=100" | jq -r '.items[].key' |
  nl -v0 | while read -r i key; do
    curl -s "$API/v1/scenes/$key/" |
      jq --argjson p "$((10 * (i + 1)))" '{key, title, items, itemOrder, example: {position: $p}}' \
      > "webserver/scenes/seed_scenes/examples/$key.json"
  done
```

The examples are legacy scenes; loading the files takes them over (above), so
reviewing a file in git is the visual audit that ends its legacy status.
