import hashlib
import json
import subprocess

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
from scenes.legacy_audit.evaluation_report import (
    Aggregate,
    fixable_curve,
    render_markdown,
)
from scenes.legacy_audit.evaluation_test import field
from scenes.legacy_audit.pass2_allowlist import REPLAYS, Entry


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
        (SceneResult("k", 10, crash="boom"), "unclean", False, False),
    ],
)
def test_scene_verdicts(result, verdict, strict, verified):
    out = Aggregate().add(result, "clean")
    assert (out["verdict"], out["strict_clean"], out["verified_clean"]) == (
        verdict,
        strict,
        verified,
    )


def test_headline_shares_leave_excluded_scenes_out():
    agg = Aggregate()
    for result, weight in [
        (scene("differ", root=False), 30),
        (scene("regression"), 10),
        (SceneResult("k", 0, crash="boom"), 20),
        (SceneResult("k", 0, excluded="legacy_broken"), 40),
    ]:
        result.times_accessed = weight
        agg.add(result, "clean")
    assert "| Pass-2-clean | 33.33% | 50.00% |" in render_markdown(agg, {"date": "d"})


def test_a_both_error_root_is_clustered_but_left_out_of_the_fix_curve():
    agg = Aggregate()
    agg.add(scene("both_error"), "clean")
    agg.add(scene("regression"), "clean")
    assert agg.cluster_scenes["POINT|coords|both_error|other"] == 1
    assert [cid for cid, _, _ in fixable_curve(agg)] == [
        "POINT|coords|regression|other"
    ]


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


@pytest.mark.parametrize(
    ("next_value", "replayed_value", "allowlisted"),
    [
        (field(value=3), 2, "replayed"),
        (field(value=3), 4, None),
        # A replay explains a different value, never an error.
        (field("eval", message="Undefined symbol q"), 2, None),
    ],
)
def test_a_replay_allowlists_a_differ_pair_when_it_gives_reacts_value(
    next_value, replayed_value, allowlisted
):
    exported, rehydrated, react, nxt = slider_scene(field(value=[-5, 5]))
    nxt["items"]["s"]["value"] = next_value
    replay = {"items": {"s": {"value": field(value=replayed_value)}}}
    result = evaluate_scene(
        exported, rehydrated, react, nxt, Tolerance(), replays={"replayed": replay}
    )
    [value] = [p for p in result.pairs if p.spec.legacy_field == "value"]
    assert value.allowlisted == allowlisted


@pytest.mark.parametrize(
    ("replayed_field", "entry", "allowlisted"),
    [
        (
            field(value=4),
            Entry("differ", "", "accepted", values=lambda _, nxt: nxt == 4),
            "replayed; then: accepted",
        ),
        # Where the replay fails, math3d-next's own value is what is drawn.
        (
            field("eval", message="Undefined symbol q"),
            Entry("regression", "eval: Undefined symbol", "accepted"),
            None,
        ),
    ],
)
def test_a_replay_allowlists_a_pair_it_turns_into_an_allowlisted_differ(
    replayed_field, entry, allowlisted
):
    exported, rehydrated, react, nxt = slider_scene(field(value=[-5, 5]))
    nxt["items"]["s"]["value"] = field(value=3)
    replay = {"items": {"s": {"value": replayed_field}}}
    result = evaluate_scene(
        exported,
        rehydrated,
        react,
        nxt,
        Tolerance(),
        [entry],
        replays={"replayed": replay},
    )
    [value] = [p for p in result.pairs if p.spec.legacy_field == "value"]
    assert value.allowlisted == allowlisted


def write_inputs(tmp_path, nxt_items, extra_next_line=False, nxt_sha256=None):
    exported, rehydrated, react, nxt = slider_scene(field(value=[-5, 5]))
    nxt["items"]["s"].update(nxt_items)
    nxt["legacy_sha256"] = (
        nxt_sha256 or hashlib.sha256(json.dumps(exported).encode()).hexdigest()
    )
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


def _replay_args(tmp_path, convention, legacy_sha256=None):
    legacy_line = (tmp_path / "legacy.jsonl").read_text().splitlines()[0]
    path = tmp_path / "replay.jsonl"
    record = {
        "key": "k",
        "convention": convention,
        "legacy_sha256": legacy_sha256
        or hashlib.sha256(legacy_line.encode()).hexdigest(),
        "crashed": None,
        "items": {"s": {"value": field(value=2)}},
    }
    path.write_text(json.dumps(record) + "\n")
    return ["--replay", str(path)]


def test_command_allowlists_a_pair_by_its_scenes_replay(tmp_path):
    args = write_inputs(tmp_path, {"value": field(value=3)})
    call_command("audit_legacy_evaluation", *args, *_replay_args(tmp_path, "round"))
    [scene] = (tmp_path / "out" / "findings.jsonl").read_text().splitlines()
    [pair] = json.loads(scene)["pairs"]
    assert pair["allowlisted"] == REPLAYS["round"]


def test_command_rejects_a_replay_of_an_unknown_convention(tmp_path):
    args = write_inputs(tmp_path, {})
    with pytest.raises(CommandError, match="unknown convention 'rounding'"):
        call_command(
            "audit_legacy_evaluation", *args, *_replay_args(tmp_path, "rounding")
        )


def test_command_rejects_a_replay_of_another_export(tmp_path):
    args = write_inputs(tmp_path, {})
    with pytest.raises(CommandError, match="another --legacy export"):
        call_command(
            "audit_legacy_evaluation", *args, *_replay_args(tmp_path, "round", "0")
        )


def test_command_rejects_a_next_evaluation_of_another_export(tmp_path):
    args = write_inputs(tmp_path, {}, nxt_sha256="0")
    with pytest.raises(CommandError, match="--next is of another --legacy export"):
        call_command("audit_legacy_evaluation", *args)


def test_command_refuses_to_overwrite_an_input(tmp_path):
    args = write_inputs(tmp_path, {})
    pass1 = tmp_path / "pass1.jsonl"
    args[args.index("--out-dir") + 1] = str(tmp_path)
    (tmp_path / "findings.jsonl").write_text(pass1.read_text())
    args[args.index(str(pass1))] = str(tmp_path / "findings.jsonl")
    with pytest.raises(CommandError, match="overwrite"):
        call_command("audit_legacy_evaluation", *args)


def test_command_refuses_an_out_dir_git_would_track(tmp_path):
    subprocess.run(["git", "init", "-q", str(tmp_path)], check=True)
    with pytest.raises(CommandError, match="isn't gitignored"):
        call_command("audit_legacy_evaluation", *write_inputs(tmp_path, {}))
