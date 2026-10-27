"""Write the legacy index shift's input and output for math3d-next's parser to check.

Reads export_legacy_audit's JSONL (no database) and writes one
``{before, after}`` line per distinct legacy expression containing a bracket.
packages/legacy-audit/src/indexShift.spec.ts checks each pair
(docs/legacy-audit/README.md).

    uv run python manage.py export_index_shift_pairs \\
        --legacy /abs/legacy.jsonl --out /abs/index_shift_pairs.jsonl

The output is production scene data; keep it in db-snapshots/ (gitignored).
"""

import json

import tqdm
from django.core.management.base import BaseCommand

from scenes.legacy_scene_utils.indexing import shift_indices
from scenes.legacy_scene_utils.translate import ItemMigrator


def expressions(dehydrated: dict):
    for group in ("mathGraphics", "mathSymbols"):
        for item in (dehydrated.get(group) or {}).values():
            for key, value in item.items():
                if isinstance(value, str) and key not in ItemMigrator.NOT_MATH:
                    yield value


class Command(BaseCommand):
    help = "Write legacy expressions with brackets and their index-shifted form."

    def add_arguments(self, parser):
        parser.add_argument("--legacy", required=True)
        parser.add_argument("--out", required=True)

    def handle(self, *args, **options):
        seen: set[str] = set()
        changed = 0
        with open(options["legacy"]) as legacy, open(options["out"], "w") as out:
            for line in tqdm.tqdm(legacy):
                for before in expressions(json.loads(line)["dehydrated"]):
                    if before in seen or ("[" not in before and "brack" not in before):
                        continue
                    seen.add(before)
                    after, _problems = shift_indices(before)
                    changed += after != before
                    out.write(json.dumps({"before": before, "after": after}) + "\n")
        self.stdout.write(f"Wrote {len(seen)} expressions; {changed} shifted.")
