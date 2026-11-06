"""Pass 2c of the legacy-migration audit (docs/legacy-audit/).

Joins both apps' evaluations of every legacy scene: math3d-react's
(eval_react.jsonl, from math3d-react's client/src/legacyAudit) and
math3d-next's (eval_next.jsonl, from packages/legacy-audit), with the inputs
they came from and pass 1's findings. Reads files only; no database.

    uv run python manage.py audit_legacy_evaluation \\
        --legacy /abs/legacy.jsonl --rehydrated /abs/rehydrated.jsonl \\
        --pass1 /abs/pass1/findings.jsonl \\
        --react /abs/pass2/eval_react.jsonl --next /abs/pass2/eval_next.jsonl \\
        --out-dir /abs/pass2/ [--replay /abs/pass2/replay_round.jsonl ...]

Writes findings.jsonl and examples.json (per scene or with keys, so --out-dir
must be gitignored) and report.md (aggregates only). Exits non-zero when a
field either evaluator emitted is neither paired nor known to be unpaired.
"""

import contextlib
import datetime
import hashlib
import itertools
import json
import subprocess
from pathlib import Path

import tqdm
from django.core.management.base import BaseCommand, CommandError

from scenes.legacy_audit.evaluation import (
    MISSING,
    Pair,
    Tolerance,
    cluster_key,
    evaluate_scene,
)
from scenes.legacy_audit.evaluation_report import (
    Aggregate,
    render_markdown,
    unaccounted,
)
from scenes.legacy_audit.pass2_allowlist import ALLOWLIST, REPLAYS


def _pair_record(p: Pair) -> dict:
    s = p.spec
    return {
        "item": s.item_id,
        "type": s.item_type,
        "legacy_field": s.legacy_field,
        "legacy_element": s.legacy_element,
        "next_field": s.next_field,
        "next_element": s.next_element,
        "severity": s.severity,
        "outcome": p.outcome,
        "detail": p.detail,
        "root": p.root,
        "cluster": cluster_key(p),
        "allowlisted": p.allowlisted,
        "legacy": {
            "status": p.legacy.status,
            "message": p.legacy.message,
            "value": None if p.legacy.value is MISSING else p.legacy.value,
        },
        "next": {
            "status": p.next.status,
            "message": p.next.message,
            "value": None if p.next.value is MISSING else p.next.value,
        },
    }


def _load_replays(paths: list[str]) -> dict[str, dict[str, dict]]:
    """Scene key → convention's reason → that scene's line of its replay."""
    replays: dict[str, dict[str, dict]] = {}
    for path in paths:
        with open(path) as f:
            for line in f:
                record = json.loads(line)
                convention = record.get("convention")
                if convention not in REPLAYS:
                    raise CommandError(f"{path}: unknown convention {convention!r}")
                replays.setdefault(record["key"], {})[REPLAYS[convention]] = record
    return replays


def _scene_record(
    lines: tuple[str, ...],
    tol: Tolerance,
    agg: Aggregate,
    replays: dict[str, dict[str, dict]],
) -> dict:
    legacy, rehydrated, react, nxt, pass1 = map(json.loads, lines)
    if pass1["key"] != legacy["key"]:
        raise CommandError(f"--pass1 is out of step with --legacy at {legacy['key']}")
    scene_replays = replays.get(legacy["key"], {})
    legacy_sha256 = hashlib.sha256(lines[0].rstrip("\r\n").encode()).hexdigest()
    if nxt.get("legacy_sha256") != legacy_sha256:
        raise CommandError(f"--next is of another --legacy export, at {legacy['key']}")
    if any(r["legacy_sha256"] != legacy_sha256 for r in scene_replays.values()):
        raise CommandError(
            f"a --replay is of another --legacy export, at {legacy['key']}"
        )
    result = evaluate_scene(
        legacy,
        rehydrated,
        react,
        nxt,
        tol,
        ALLOWLIST,
        scene_replays,
    )
    verdict = agg.add(result, pass1["verdict"])
    return {
        "key": result.key,
        "times_accessed": result.times_accessed,
        "pass1_verdict": pass1["verdict"],
        **verdict,
        "pairs": [_pair_record(p) for p in result.pairs if p.outcome != "equal"],
    }


class Command(BaseCommand):
    help = "Compare math3d-react's and math3d-next's evaluations of every legacy scene."

    def add_arguments(self, parser):
        for name in ("legacy", "rehydrated", "pass1", "react", "next", "out-dir"):
            parser.add_argument(f"--{name}", required=True)
        parser.add_argument("--rtol", type=float, default=Tolerance.rtol)
        parser.add_argument("--atol", type=float, default=Tolerance.atol)
        parser.add_argument("--loose-rtol", type=float, default=Tolerance.loose_rtol)
        parser.add_argument("--limit", type=int, default=None)
        parser.add_argument(
            "--replay",
            action="append",
            default=[],
            help="a convention replay from packages/legacy-audit",
        )
        parser.add_argument(
            "--meta",
            action="append",
            default=[],
            help="key=value for the report header",
        )

    def handle(self, *args, **options):
        bad_meta = [m for m in options["meta"] if "=" not in m]
        if bad_meta:
            raise CommandError(f"--meta takes key=value: {bad_meta}")
        tol = Tolerance(options["rtol"], options["atol"], options["loose_rtol"])
        out_dir = Path(options["out_dir"])
        inputs = [
            options[n] for n in ("legacy", "rehydrated", "pass1", "react", "next")
        ]
        if (out_dir / "findings.jsonl").resolve() in {
            Path(p).resolve() for p in [*inputs, *options["replay"]]
        }:
            raise CommandError("--out-dir would overwrite an input's findings.jsonl")
        out_dir.mkdir(parents=True, exist_ok=True)
        # findings.jsonl and examples.json hold scene keys.
        tracked = subprocess.run(
            ["git", "-C", str(out_dir), "check-ignore", "-q", "."],
            capture_output=True,
            check=False,
        )
        if tracked.returncode == 1:
            raise CommandError(f"--out-dir {out_dir} isn't gitignored")
        agg = Aggregate()
        replays = _load_replays(options["replay"])
        names = ("legacy", "rehydrated", "react", "next", "pass1")
        with contextlib.ExitStack() as stack:
            files = [stack.enter_context(open(options[n])) for n in names]
            findings = stack.enter_context(open(out_dir / "findings.jsonl", "w"))
            for count, lines in enumerate(tqdm.tqdm(itertools.zip_longest(*files))):
                if options["limit"] is not None and count >= options["limit"]:
                    break
                if None in lines:
                    raise CommandError(
                        f"{', '.join(f'--{n}' for n in names)} must have one line "
                        "per scene, in the same order"
                    )
                findings.write(
                    json.dumps(_scene_record(lines, tol, agg, replays)) + "\n"
                )

        meta = {
            "date": datetime.date.today().isoformat(),
            "Tolerances": f"rtol {tol.rtol:g}, atol {tol.atol:g}, loose rtol {tol.loose_rtol:g}",
        }
        meta.update(dict(m.split("=", 1) for m in options["meta"]))
        (out_dir / "report.md").write_text(render_markdown(agg, meta))
        (out_dir / "examples.json").write_text(json.dumps(agg.top_examples(), indent=1))
        self.stdout.write(f"Wrote {out_dir / 'report.md'}")
        missing = unaccounted(agg)
        if missing:
            listing = "\n".join(
                f"  {side} {t}.{f}: {n:,}" for side, t, f, n in missing[:30]
            )
            raise CommandError(
                f"Fields neither paired nor known to be unpaired:\n{listing}"
            )
