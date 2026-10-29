"""Pass 1 of the legacy-migration audit (docs/legacy-audit/).

Compares every legacy scene as math3d-react shows it (rehydrated.jsonl, from
math3d-react's client/src/legacyAudit) with its math3d-next translation
(legacy.jsonl, from export_legacy_audit). Reads files only; no database.

    uv run python manage.py audit_legacy_migration \\
        --legacy /abs/legacy.jsonl --rehydrated /abs/rehydrated.jsonl \\
        --defaults /abs/react_defaults.json --out-dir /abs/out/

Writes findings.jsonl and manual_checks.json (per scene, contain keys: keep
out of git) and report.md (aggregates only).
"""

import datetime
import json
from pathlib import Path

import tqdm
from django.core.management.base import BaseCommand

from scenes.legacy_audit import expected
from scenes.legacy_audit.compare import compare_scene
from scenes.legacy_audit.report import Aggregate, render_markdown

CALIBRATION_SIZE = 20
# The most-viewed scenes are checked by hand where a policy changes what
# math3d-react showed.
MANUAL_CHECK_TOP = 100


def hidden_by_blank_visibility(rehydrated: dict) -> list[str]:
    """Items math3d-react showed on load that math3d-next hides: calculated
    visibility on, a blank expression, and visible false."""
    return [
        item_id
        for item_id, item in (rehydrated.get("mathGraphics") or {}).items()
        if item.get("useCalculatedVisibility") is True
        and item.get("visible") is False
        and expected.is_blank(item.get("calculatedVisibility"))
    ]


class Command(BaseCommand):
    help = "Compare math3d-react's rehydrated legacy scenes with their translation."

    def add_arguments(self, parser):
        parser.add_argument("--legacy", required=True)
        parser.add_argument("--rehydrated", required=True)
        parser.add_argument("--defaults", required=True)
        parser.add_argument("--out-dir", required=True)
        parser.add_argument(
            "--meta",
            action="append",
            default=[],
            help="key=value for the report header",
        )

    def handle(self, *args, **options):
        react_defaults = json.loads(Path(options["defaults"]).read_text())
        defaults = react_defaults["defaultSettings"]
        initial_graphics = react_defaults["initialState"]["mathGraphics"]
        default_values = {
            v
            for settings in defaults.values()
            for v in settings.values()
            if isinstance(v, str)
        }
        out_dir = Path(options["out_dir"])
        out_dir.mkdir(parents=True, exist_ok=True)
        agg = Aggregate()
        top: list[tuple[float, dict]] = []
        hidden: list[tuple[float, str, list[str]]] = []
        with (
            open(options["legacy"]) as legacy_file,
            open(options["rehydrated"]) as rehydrated_file,
            open(out_dir / "findings.jsonl", "w") as findings,
        ):
            for legacy_line, rehydrated_line in tqdm.tqdm(
                zip(legacy_file, rehydrated_file, strict=True)
            ):
                rehydrated = json.loads(rehydrated_line)
                result = compare_scene(
                    json.loads(legacy_line),
                    rehydrated,
                    defaults,
                    expected,
                    initial_graphics,
                )
                verdict = agg.add(result, default_values)
                record = {
                    "key": result.key,
                    "times_accessed": result.times_accessed,
                    **verdict,
                    "flags": result.flags,
                    "mismatches": [
                        {
                            "item": c.item_id,
                            "type": c.item_type,
                            "path": c.path,
                            "severity": c.severity,
                            "expected": c.expected,
                            "actual": c.actual,
                        }
                        for c in result.comparisons
                        if c.outcome == "mismatch"
                    ],
                    "item_failures": result.item_failures,
                    "order_failures": result.order_failures,
                }
                findings.write(json.dumps(record, default=str) + "\n")
                top.append(
                    (
                        result.times_accessed,
                        {
                            "verdict": verdict["verdict"],
                            "clusters": verdict.get("clusters", []),
                        },
                    )
                )
                top = sorted(top, key=lambda t: -t[0])[:CALIBRATION_SIZE]
                hidden.append(
                    (
                        result.times_accessed,
                        result.key,
                        hidden_by_blank_visibility(rehydrated),
                    )
                )

        meta = {"date": datetime.date.today().isoformat()}
        meta.update(dict(m.split("=", 1) for m in options["meta"]))
        (out_dir / "report.md").write_text(render_markdown(agg, meta))
        (out_dir / "calibration.json").write_text(
            json.dumps(
                [
                    {"rank": i + 1, "times_accessed": w, **v}
                    for i, (w, v) in enumerate(top)
                ],
                indent=2,
            )
        )
        ranked = sorted(hidden, key=lambda t: -t[0])[:MANUAL_CHECK_TOP]
        (out_dir / "manual_checks.json").write_text(
            json.dumps(
                {
                    "hidden_by_blank_visibility": [
                        {"rank": i + 1, "key": key, "items": items}
                        for i, (_, key, items) in enumerate(ranked)
                        if items
                    ]
                },
                indent=2,
            )
        )
        self.stdout.write(f"Wrote {out_dir / 'report.md'}")
