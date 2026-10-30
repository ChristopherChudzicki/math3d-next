import json

import pytest
from django.core.management import call_command
from django.core.management.base import CommandError

from scenes.legacy_audit.evaluation import (
    OK,
    Pair,
    PairSpec,
    SceneResult,
    Side,
    Tolerance,
    evaluate_scene,
)
from scenes.legacy_audit.evaluation_report import Aggregate, fixable_curve
from scenes.legacy_audit.pass2_allowlist import Entry


def scene(outcome, severity="render", root=True, allowlisted=None):
    spec = PairSpec("i", "POINT", "coords", None, "coords", None, severity)
    pair = Pair(spec, Side(OK, 1), Side(OK, 2), outcome, "other", root=root)
    pair.allowlisted = allowlisted
    return SceneResult("k", 10, pairs=[pair])


@pytest.mark.parametrize(
    ("result", "verdict", "strict", "verified"),
    [
        (scene("regression"), "unclean", False, False),
        (scene("differ", root=False), "clean", True, True),
        (scene("differ", allowlisted="accepted"), "clean", True, True),
        (scene("both_error"), "clean", True, True),
        (scene("differ", severity="editor"), "clean", False, True),
        (scene("unsure"), "clean", True, False),
    ],
)
def test_scene_verdicts(result, verdict, strict, verified):
    out = Aggregate().add(result, "clean")
    assert (out["verdict"], out["strict_clean"], out["verified_clean"]) == (
        verdict,
        strict,
        verified,
    )


def test_a_both_error_root_is_clustered_but_left_out_of_the_fix_curve():
    agg = Aggregate()
    agg.add(scene("both_error"), "clean")
    agg.add(scene("regression"), "clean")
    assert agg.cluster_scenes["POINT|coords|both_error|other"] == 1
    assert [cid for cid, _, _ in fixable_curve(agg)] == [
        "POINT|coords|regression|other"
    ]


def field(status=OK, value=1, **extra):
    return {"status": status, "value": value, "deps": [], **extra}


def slider_scene(next_range):
    slider = {"type": "VARIABLE_SLIDER", "name": "T", "min": "-5", "max": "5"}
    exported = {
        "key": "k",
        "times_accessed": 10,
        "migrated": {"items": [{"id": "s", "type": "VARIABLE_SLIDER"}]},
    }
    rehydrated = {
        "key": "k",
        "mathGraphics": {},
        "mathSymbols": {"s": slider},
        "sliderValues": {"s": 2},
    }
    react = {
        "key": "k",
        "crashed": False,
        "items": {
            "s": {
                "value": field(value=2),
                "min": field(value=-5),
                "max": field(value=5),
            }
        },
    }
    nxt = {
        "key": "k",
        "crashed": False,
        "items": {"s": {"value": field(value=2), "range": next_range}},
    }
    return exported, rehydrated, react, nxt


def test_slider_bounds_take_the_status_of_their_own_range_element():
    failed_max = field(
        "eval",
        elements=[{"status": OK}, {"status": "eval", "message": "Undefined symbol q"}],
    )
    del failed_max["value"]
    allowlist = [
        Entry("regression", "eval: Undefined symbol", "test", next_field="range")
    ]
    exported, rehydrated, react, nxt = slider_scene(failed_max)
    result = evaluate_scene(exported, rehydrated, react, nxt, Tolerance(), allowlist)
    outcomes = {p.spec.legacy_field: (p.outcome, p.allowlisted) for p in result.pairs}
    assert outcomes == {
        "value": ("equal", None),
        "min": ("unsure", None),
        "max": ("regression", "test"),
    }


def write_inputs(tmp_path, nxt_items, extra_next_line=False):
    exported, rehydrated, react, nxt = slider_scene(field(value=[-5, 5]))
    nxt["items"]["s"].update(nxt_items)
    lines = {
        "legacy": [exported],
        "rehydrated": [rehydrated],
        "react": [react],
        "next": [nxt, nxt] if extra_next_line else [nxt],
        "pass1": [{"key": "k", "verdict": "clean"}],
    }
    args = []
    for name, records in lines.items():
        path = tmp_path / f"{name}.jsonl"
        path.write_text("".join(json.dumps(r) + "\n" for r in records))
        args += [f"--{name}", str(path)]
    return [*args, "--out-dir", str(tmp_path / "out")]


def test_command_fails_on_an_unaccounted_field_after_writing_the_report(tmp_path):
    with pytest.raises(CommandError, match="newField"):
        call_command(
            "audit_legacy_evaluation", *write_inputs(tmp_path, {"newField": field()})
        )
    assert (tmp_path / "out" / "report.md").exists()


def test_command_names_the_inputs_when_their_lengths_differ(tmp_path):
    with pytest.raises(CommandError, match="one line per scene"):
        call_command(
            "audit_legacy_evaluation", *write_inputs(tmp_path, {}, extra_next_line=True)
        )
