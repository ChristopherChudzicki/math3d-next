from dataclasses import dataclass
from types import SimpleNamespace
from typing import Any

from scenes.legacy_audit.compare import compare_scene
from scenes.legacy_audit.report import RENDER


@dataclass(frozen=True)
class NeedsEval:
    reason: str


@dataclass(frozen=True)
class Expectation:
    path: str
    value: Any
    severity: str
    source: str


def _point(item, ctx):
    return [
        Expectation("color", item["color"], "render", "color"),
        Expectation("description", item["description"], "editor", "description"),
        Expectation(
            "size",
            NeedsEval("test") if item["size"] == "2\\pi" else item["size"],
            "render",
            "size",
        ),
    ]


def _folder(item, ctx):
    return [Expectation("description", item["description"], "editor", "description")]


TABLE = SimpleNamespace(
    NeedsEval=NeedsEval,
    Context=lambda **kwargs: SimpleNamespace(**kwargs),
    EXPECTATIONS={"POINT": _point, "FOLDER": _folder},
    LEGACY_TYPE_TO_NEXT_TYPE={"POINT": "POINT", "FOLDER": "FOLDER"},
)
DEFAULTS = {
    "POINT": {
        "type": "POINT",
        "color": "#3090FF",
        "description": "Point",
        "size": "16",
    },
    "FOLDER": {"description": "Folder"},
}


def _scene(point, migrated_point, *, migrated_extra=(), tree=None) -> tuple[dict, dict]:
    tree = tree or {"setup": [], "root": ["f"], "f": ["p"]}
    rehydrated = {
        "key": "k",
        "mathGraphics": {"p": {"type": "POINT", **point}},
        "mathSymbols": {},
        "folders": {"f": {"description": "Folder"}},
        "sortableTree": tree,
        "sliderValues": {},
        "legacy_broken": [],
    }
    order = {k: v for k, v in tree.items() if k != "root"} | {"main": tree["root"]}
    exported = {
        "key": "k",
        "times_accessed": 3,
        "dehydrated": {
            "mathGraphics": {"p": {"type": "POINT", "color": point["color"]}}
        },
        "migrate_error": None,
        "migrated": {
            "items": [
                {"id": "f", "type": "FOLDER", "properties": {"description": "Folder"}},
                {"id": "p", "type": "POINT", "properties": migrated_point},
                *migrated_extra,
            ],
            "item_order": order,
            "title": "",
            "creation_date": None,
        },
    }
    return exported, rehydrated


POINT = {"color": "red", "description": "Point", "size": "16"}


def _outcomes(result):
    return {c.path: c.outcome for c in result.comparisons if c.item_id == "p"}


def test_matching_translation_is_clean():
    result = compare_scene(*_scene(POINT, {**POINT, "size": "16"}), DEFAULTS, TABLE)
    assert _outcomes(result) == {
        "color": "match",
        "description": "match",
        "size": "match",
    }
    assert result.clusters(RENDER) == set()


def test_render_mismatch_is_unclean_and_records_whether_legacy_value_was_default():
    result = compare_scene(*_scene(POINT, {**POINT, "color": "blue"}), DEFAULTS, TABLE)
    assert _outcomes(result)["color"] == "mismatch"
    assert result.clusters(RENDER) == {"mismatch|POINT|color|color|legacy-custom"}


def test_editor_mismatch_does_not_affect_render_clean():
    result = compare_scene(
        *_scene(POINT, {**POINT, "description": "Other"}), DEFAULTS, TABLE
    )
    assert _outcomes(result)["description"] == "mismatch"
    assert result.clusters(RENDER) == set()


def test_needs_eval_and_missing_target_field():
    scene = _scene({**POINT, "size": "2\\pi"}, {"color": "red", "description": "Point"})
    result = compare_scene(*scene, DEFAULTS, TABLE)
    assert _outcomes(result)["size"] == "needs_eval"
    scene = _scene(POINT, {"color": "red", "description": "Point"})
    assert _outcomes(compare_scene(*scene, DEFAULTS, TABLE))["size"] == "mismatch"


def test_unknown_property_is_recorded_without_comparing_it():
    result = compare_scene(*_scene({**POINT, "samples": "5"}, POINT), DEFAULTS, TABLE)
    assert result.unknown_properties == [("POINT", "samples")]


def test_extra_shown_item_and_folder_membership_change_are_render_failures():
    extra = {"id": "q", "type": "POINT", "properties": POINT}
    exported, rehydrated = _scene(POINT, POINT, migrated_extra=[extra])
    exported["migrated"]["item_order"]["f"] = ["p", "q"]
    result = compare_scene(exported, rehydrated, DEFAULTS, TABLE)
    assert ("extra", "POINT", "q", "render") in result.item_failures
    assert ("membership", "render") in result.order_failures


def test_translation_crash_is_its_own_cluster():
    exported, rehydrated = _scene(POINT, POINT)
    exported["migrate_error"] = {
        "type": "TypeError",
        "message": "got an unexpected keyword argument 'samples'",
    }
    exported["migrated"] = None
    result = compare_scene(exported, rehydrated, DEFAULTS, TABLE)
    assert result.clusters(RENDER) == {
        "crash|TypeError: got an unexpected keyword argument '…'"
    }
