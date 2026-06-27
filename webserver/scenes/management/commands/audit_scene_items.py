"""Read-only audit: validate every stored Scene's `items` against the current
Pydantic math-item schema and report failures grouped by *kind*.

Unlike `migrate_legacy_data` (which validates on save and aborts on the first
bad scene), this never writes and never stops early — it scans the whole table
and buckets failures by `(item type, error type, field path)` so a corpus of
100k scenes collapses to the handful of distinct problems worth acting on.

    docker compose run --rm webserver uv run ./manage.py audit_scene_items
    docker compose run --rm webserver uv run ./manage.py audit_scene_items --legacy-only
    docker compose run --rm webserver uv run ./manage.py audit_scene_items --out db-snapshots/audit.jsonl
"""

import json
import os
from collections import Counter

import tqdm
from django.core.management.base import BaseCommand
from pydantic import ValidationError as PydanticValidationError

from scenes.models import Scene
from scenes.schemas.math_items import MATH_ITEM_LIST_ADAPTER, MathItemType

_ITEM_TYPE_VALUES = {m.value for m in MathItemType}


def _signature(error, items):
    """Reduce one Pydantic error to a stable (item_type, error_type, field) key.

    Error `loc` for the `list[discriminated-union]` adapter looks like
    `(index, <type-tag>, 'properties', 'field', ...)`. We drop the list index,
    pull the discriminator tag as the item type (falling back to the raw item's
    own `type` when the tag is absent, e.g. an unknown-discriminator error), and
    strip any remaining list indices from the field path so per-element failures
    collapse together.
    """
    loc = list(error["loc"])
    index = loc[0] if loc and isinstance(loc[0], int) else None
    rest = loc[1:] if index is not None else loc

    if rest and isinstance(rest[0], str) and rest[0] in _ITEM_TYPE_VALUES:
        item_type, field_parts = rest[0], rest[1:]
    else:
        field_parts = rest
        item_type = None
        if index is not None and index < len(items) and isinstance(items[index], dict):
            item_type = items[index].get("type")

    field = ".".join(str(p) for p in field_parts if not isinstance(p, int))
    return (item_type or "?", error["type"], field or "(root)")


class Command(BaseCommand):
    help = "Validate stored Scene.items against the Pydantic schema (read-only)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--legacy-only",
            action="store_true",
            help="Only audit scenes with is_legacy=True.",
        )
        parser.add_argument(
            "--chunk-size",
            type=int,
            default=1000,
            help="Rows per fetch chunk (default: 1000).",
        )
        parser.add_argument(
            "--limit",
            type=int,
            help="Audit at most this many scenes (for a quick sample).",
        )
        parser.add_argument(
            "--out",
            type=str,
            help="Write full per-scene failures as JSONL to this path.",
        )

    def handle(self, *args, **options):
        qs = Scene.objects.all()
        if options["legacy_only"]:
            qs = qs.filter(is_legacy=True)
        qs = qs.values("key", "items")
        if options["limit"]:
            qs = qs[: options["limit"]]

        total = qs.count()
        self.stdout.write(f"Auditing {total} scenes...")

        scanned = passed = failed = 0
        buckets: Counter = Counter()
        examples: dict = {}
        out = None
        if options["out"]:
            parent = os.path.dirname(options["out"])
            if parent:
                os.makedirs(parent, exist_ok=True)
            out = open(options["out"], "w")

        try:
            rows = qs.iterator(chunk_size=options["chunk_size"])
            for row in tqdm.tqdm(rows, total=total, desc="Validating"):
                scanned += 1
                try:
                    MATH_ITEM_LIST_ADAPTER.validate_python(row["items"])
                    passed += 1
                except PydanticValidationError as exc:
                    failed += 1
                    errors = exc.errors()
                    for err in errors:
                        sig = _signature(err, row["items"])
                        buckets[sig] += 1
                        examples.setdefault(sig, row["key"])
                    if out:
                        out.write(
                            json.dumps(
                                {"key": row["key"], "errors": errors}, default=str
                            )
                            + "\n"
                        )
        finally:
            if out:
                out.close()

        self._report(scanned, passed, failed, buckets, examples)
        if options["out"]:
            self.stdout.write(f"\nFull per-scene failures written to {options['out']}")

    def _report(self, scanned, passed, failed, buckets, examples):
        self.stdout.write("")
        style = self.style.SUCCESS if failed == 0 else self.style.WARNING
        self.stdout.write(
            style(f"scanned {scanned} · passed {passed} · failed {failed}")
        )
        if not buckets:
            return

        self.stdout.write(f"\n{len(buckets)} distinct failure kind(s):\n")
        header = f"{'count':>7}  {'example key':<14}  signature"
        self.stdout.write(header)
        self.stdout.write("-" * len(header))
        for sig, count in buckets.most_common():
            item_type, err_type, field = sig
            self.stdout.write(
                f"{count:>7}  {examples[sig]:<14}  {item_type} / {err_type} / {field}"
            )
