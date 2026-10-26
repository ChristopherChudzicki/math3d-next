"""The audit must catch translator bugs: inject known ones and check each is flagged.

`_rehydrate` reproduces math3d-react's rehydrate (client/src/store/hydration.js),
which is plain object merging over defaultSettings and initialState, so these
tests can run without math3d-react. The real audit uses math3d-react's own code.
"""

import json
from pathlib import Path

import pytest

from scenes.legacy_audit import expected
from scenes.legacy_audit.compare import compare_scene
from scenes.legacy_scene_utils.migrate_scene import translate_legacy_scene
from scenes.legacy_scene_utils.translate import ItemMigrator

FIXTURE = json.loads(
    (Path(__file__).parent / "fixtures" / "react_defaults.json").read_text()
)
DEFAULTS = FIXTURE["defaultSettings"]
INITIAL = FIXTURE["initialState"]

DEHYDRATED = {
    "metadata": {"title": "t", "creationDate": '"2020-01-01T00:00:00Z"'},
    "sortableTree": {"root": ["f"], "f": ["s", "p", "v", "slider"]},
    "folders": {"f": {"description": "Mine"}},
    "mathGraphics": {
        "s": {
            "type": "EXPLICIT_SURFACE",
            "rangeU": "\\left[-1,\\ 3\\right]",
            "rangeV": "\\left[0,\\ 2\\right]",
        },
        "p": {
            "type": "POINT",
            "labelVisible": True,
            "color": "#ff0000",
            "coords": "c\\left[1\\right]",
        },
        "v": {"type": "VECTOR_FIELD", "samples": "[4, 6, 8]"},
        "axis-x": {"type": "AXIS", "max": "10"},
    },
    "mathSymbols": {"slider": {"type": "VARIABLE_SLIDER", "name": "a", "value": "2"}},
    "sliderValues": {"slider": 2},
}


def _rehydrate(dehydrated: dict) -> dict:
    def merge(saved: dict, initial: dict, folders: bool = False) -> dict:
        combined = {**initial, **saved}
        return {
            key: {
                **DEFAULTS["FOLDER" if folders else item["type"]],
                **initial.get(key, {}),
                **item,
            }
            for key, item in combined.items()
        }

    tree = {
        **{
            k: v
            for k, v in INITIAL["sortableTree"].items()
            if k in ("setup", "cameraFolder", "axes")
        },
        **dehydrated["sortableTree"],
    }
    empty_folders: dict[str, dict] = {folder_id: {} for folder_id in tree["root"]}
    return {
        "key": "k",
        "mathGraphics": merge(dehydrated["mathGraphics"], INITIAL["mathGraphics"]),
        "mathSymbols": merge(dehydrated["mathSymbols"], INITIAL["mathSymbols"]),
        "folders": merge(
            {**empty_folders, **dehydrated["folders"]}, INITIAL["folders"], folders=True
        ),
        "sortableTree": tree,
        "sliderValues": dehydrated["sliderValues"],
        "metadata": dehydrated["metadata"],
        "legacy_broken": [],
    }


def _mismatches() -> set[tuple[str, str]]:
    translated = translate_legacy_scene(DEHYDRATED)
    exported = {
        "key": "k",
        "times_accessed": 1,
        "dehydrated": DEHYDRATED,
        "migrate_error": None,
        "migrated": {
            "items": translated.items,
            "item_order": translated.item_order,
            "title": translated.title,
            "creation_date": translated.creation_date,
        },
    }
    result = compare_scene(exported, _rehydrate(DEHYDRATED), DEFAULTS, expected)
    return {(c.item_id, c.path) for c in result.comparisons if c.outcome == "mismatch"}


def _swap_domain(props):
    props.domain.items.reverse()


def _flip_label(props):
    props.labelVisible = "false" if props.labelVisible == "true" else "true"


def _wrong_samples(props):
    props.samples1 = "99"


def _wrong_slider(props):
    props.value.rhs = props.value.rhs + "+1"


def _drop_axis_max(props):
    props.max = "+5"


MUTATIONS = [
    ("translate_explicit_surface", _swap_domain, ("s", "domain.items.0.rhs")),
    ("translate_point", _flip_label, ("p", "labelVisible")),
    ("translate_vector_field", _wrong_samples, ("v", "samples1")),
    ("translate_variable_slider", _wrong_slider, ("slider", "value.rhs")),
    ("translate_axis", _drop_axis_max, ("axis-x", "max")),
]


@pytest.mark.parametrize(("method", "mutate", "flagged"), MUTATIONS)
def test_injected_translator_bug_is_flagged(monkeypatch, method, mutate, flagged):
    assert flagged not in _mismatches()
    original = getattr(ItemMigrator, method)

    def mutated(self, props):
        out = original(self, props)
        mutate(out)
        return out

    monkeypatch.setattr(ItemMigrator, method, mutated)
    assert flagged in _mismatches()


def test_skipped_index_shift_is_flagged(monkeypatch):
    assert ("p", "coords") not in _mismatches()
    monkeypatch.setattr(ItemMigrator, "shift_indices", lambda self, props: props)
    assert ("p", "coords") in _mismatches()
