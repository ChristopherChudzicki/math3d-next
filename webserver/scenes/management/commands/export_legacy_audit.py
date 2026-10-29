"""Export every legacy scene, with its current translation, as JSONL.

This is the shared input for the legacy-migration audit (docs/legacy-audit/):
math3d-react's rehydrate audit and math3d-next's comparison both read it, so
both judge the same snapshot. Read-only: it translates in memory and never
calls migrate_scene, which writes.

    uv run python manage.py export_legacy_audit --out /abs/path/legacy.jsonl

The output is production scene data; keep it in db-snapshots/ (gitignored).
"""

import json

import tqdm
from django.core.management.base import BaseCommand

from scenes.legacy_scene_utils.migrate_scene import translate_legacy_scene
from scenes.models import LegacyScene
from scenes.validators import validate_math_items


def export_line(legacy: LegacyScene) -> dict:
    migrated = None
    migrate_error = None
    try:
        translated = translate_legacy_scene(legacy.dehydrated)
        # Scene.save() re-validates items via full_clean(); a failure there is
        # also a 500 on GET, so it belongs with the translation errors.
        validate_math_items(translated.items)
        migrated = {
            "items": translated.items,
            "item_order": translated.item_order,
            "title": translated.title,
            "creation_date": translated.creation_date,
        }
    except Exception as e:  # noqa: BLE001 — every failure is data here
        migrate_error = {"type": type(e).__name__, "message": str(e)}
    return {
        "key": legacy.key,
        "times_accessed": legacy.times_accessed,
        "dehydrated": legacy.dehydrated,
        "migrated": migrated,
        "migrate_error": migrate_error,
    }


class Command(BaseCommand):
    help = "Export legacy scenes and their current translation as JSONL (read-only)."

    def add_arguments(self, parser):
        parser.add_argument("--out", required=True, help="Output JSONL path")
        parser.add_argument("--limit", type=int, help="Export only the first N scenes")

    def handle(self, *args, **options):
        queryset = LegacyScene.objects.order_by("id")
        if options["limit"]:
            queryset = queryset[: options["limit"]]
        total = queryset.count()
        errors = 0
        with open(options["out"], "w") as out:
            for legacy in tqdm.tqdm(queryset.iterator(chunk_size=500), total=total):
                line = export_line(legacy)
                errors += line["migrate_error"] is not None
                out.write(json.dumps(line) + "\n")
        self.stdout.write(
            f"Exported {total} legacy scenes; {errors} failed to translate."
        )
