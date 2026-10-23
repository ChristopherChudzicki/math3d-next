"""Compare one legacy scene as math3d-react shows it with its math3d-next translation.

Inputs are one line each from export_legacy_audit (the translation) and from
math3d-react's rehydrate audit (the legacy state). The expected-translation
table (expected.py) turns each rehydrated legacy item into the values
math3d-next should hold; this module only diffs and classifies.
"""

import re
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Any

from scenes.legacy_audit.normalize import equivalence

MISSING = "<missing>"
FOLDER = "FOLDER"
# Item ids math3d-react always shows, in the fixed "setup" part of the tree.
FIXED_FOLDERS = ("setup",)


@dataclass
class Comparison:
    item_id: str
    item_type: str
    path: str
    source: str
    severity: str
    outcome: str  # match | match_normalized | mismatch | needs_eval | expectation_error
    normalization: str | None = None
    expected: Any = None
    actual: Any = None
    at_default: bool | None = None


@dataclass
class SceneResult:
    key: str
    times_accessed: int
    crash: str | None = None
    legacy_broken: list[str] = field(default_factory=list)
    comparisons: list[Comparison] = field(default_factory=list)
    item_failures: list[tuple[str, str, str, str]] = field(default_factory=list)
    order_failures: list[tuple[str, str]] = field(default_factory=list)
    unknown_properties: list[tuple[str, str]] = field(default_factory=list)
    inventory: list[tuple[str, str]] = field(default_factory=list)
    flags: list[str] = field(default_factory=list)

    def clusters(self, severities: frozenset[str]) -> set[str]:
        """Root-cause ids of everything that makes this scene unclean at the
        given severities."""
        ids: set[str] = set()
        if self.crash:
            ids.add(f"crash|{self.crash}")
        for kind, item_type, _item_id, severity in self.item_failures:
            if severity in severities:
                ids.add(f"item|{kind}|{item_type}")
        for kind, severity in self.order_failures:
            if severity in severities:
                ids.add(f"order|{kind}")
        for c in self.comparisons:
            if c.outcome == "mismatch" and c.severity in severities:
                ids.add(cluster_id(c))
        return ids


def cluster_id(c: Comparison) -> str:
    default = {True: "legacy-default", False: "legacy-custom", None: "constant"}[
        c.at_default
    ]
    return f"mismatch|{c.item_type}|{c.path}|{c.source}|{default}"


def crash_template(error: dict) -> str:
    message = re.sub(r"'[^']*'|\"[^\"]*\"", "'…'", error["message"])
    message = re.sub(r"\d+", "N", message)
    return f"{error['type']}: {message[:160]}"


def get_path(obj: Any, path: str) -> Any:
    current = obj
    for part in path.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
        elif isinstance(current, list) and part.isdigit() and int(part) < len(current):
            current = current[int(part)]
        else:
            return MISSING
    return current


def legacy_items(rehydrated: dict) -> dict[str, dict]:
    items: dict[str, dict] = {}
    for item_id, folder in rehydrated.get("folders", {}).items():
        items[item_id] = {**folder, "type": FOLDER}
    items.update(rehydrated.get("mathGraphics", {}))
    items.update(rehydrated.get("mathSymbols", {}))
    return items


def shown_ids(tree: dict[str, list[str]], root_key: str) -> set[str]:
    """Ids math3d-react (root_key="root") or math3d-next ("main") displays:
    the fixed and root folders and their children."""
    folders = [*tree.get("setup", []), *tree.get(root_key, [])]
    shown = set(folders)
    for folder_id in folders:
        shown.update(tree.get(folder_id) or [])
    return shown


def _at_default(source: str, item: dict, defaults: dict[str, Any]) -> bool | None:
    if source == "constant":
        return None
    props = [p.strip() for p in re.split(r"[,+]", source) if p.strip() in defaults]
    if not props:
        return None
    return all(item.get(p) == defaults[p] for p in props)


def _flags(items: dict[str, dict], defaults: dict[str, dict]) -> list[str]:
    flags = []
    axis_default = defaults.get("AXIS", {})
    for axis_id, initial_scale in (("axis-x", "1"), ("axis-y", "1"), ("axis-z", "1/2")):
        scale = items.get(axis_id, {}).get("scale", axis_default.get("scale"))
        if str(scale).replace(" ", "") != initial_scale:
            flags.append("custom_axis_scale")
            break
    camera = items.get("camera", {})
    if camera.get("useComputed"):
        flags.append("camera_use_computed")
    if camera.get("isOrthographic"):
        flags.append("camera_orthographic")
    return flags


def compare_scene(
    exported: dict,
    rehydrated: dict,
    defaults: dict[str, dict],
    table: Any,
) -> SceneResult:
    """Classify everything that differs between math3d-react's view of a scene
    (`rehydrated`) and its math3d-next translation (`exported`)."""
    result = SceneResult(key=exported["key"], times_accessed=exported["times_accessed"])
    assert rehydrated["key"] == exported["key"], "input files are out of step"

    _inventory(result, exported["dehydrated"])
    result.legacy_broken = rehydrated.get("legacy_broken", [])
    if "mathGraphics" not in rehydrated:
        return result
    items = legacy_items(rehydrated)
    result.flags = _flags(items, defaults)
    for item_id, item in items.items():
        known = defaults.get(item.get("type", ""), {})
        result.unknown_properties.extend(
            (item.get("type", "?"), prop)
            for prop in item
            if prop not in known and prop != "type"
        )
    if exported["migrate_error"]:
        result.crash = crash_template(exported["migrate_error"])
        return result

    migrated = exported["migrated"]
    by_id = {item["id"]: item for item in migrated["items"]}
    legacy_shown = shown_ids(rehydrated["sortableTree"], "root")
    next_shown = shown_ids(migrated["item_order"], "main")

    for item_id, item in items.items():
        severity = "render" if item_id in legacy_shown else "none"
        actual = by_id.get(item_id)
        if actual is None:
            result.item_failures.append(("missing", item["type"], item_id, severity))
            continue
        expected_type = table.LEGACY_TYPE_TO_NEXT_TYPE.get(item["type"], item["type"])
        if actual["type"] != expected_type:
            result.item_failures.append(("wrong_type", item["type"], item_id, severity))
            continue
        _compare_item(result, item_id, item, actual, defaults, rehydrated, table)

    for item_id, actual in by_id.items():
        if item_id not in items:
            severity = "render" if item_id in next_shown else "none"
            result.item_failures.append(("extra", actual["type"], item_id, severity))

    _compare_order(result, rehydrated["sortableTree"], migrated["item_order"])
    _compare_scene_fields(result, exported, migrated)
    return result


def _compare_item(
    result: SceneResult,
    item_id: str,
    item: dict,
    actual: dict,
    defaults: dict[str, dict],
    rehydrated: dict,
    table: Any,
) -> None:
    item_type = item["type"]
    expect: Callable = table.EXPECTATIONS[item_type]
    ctx = table.Context(
        item_id=item_id,
        axes={
            k: v for k, v in rehydrated["mathGraphics"].items() if k.startswith("axis-")
        },
        slider_values=rehydrated.get("sliderValues") or {},
    )
    try:
        expectations = expect(item, ctx)
    except Exception as e:  # noqa: BLE001 — an unexpected legacy value is data here
        result.comparisons.append(
            Comparison(
                item_id,
                item_type,
                "*",
                "*",
                "none",
                "expectation_error",
                expected=f"{type(e).__name__}: {e}",
            )
        )
        return
    type_defaults = defaults.get(item_type, {})
    for exp in expectations:
        value = get_path(actual["properties"], exp.path)
        comparison = Comparison(
            item_id=item_id,
            item_type=item_type,
            path=exp.path,
            source=exp.source,
            severity=exp.severity,
            outcome="match",
            expected=exp.value,
            actual=value,
            at_default=_at_default(exp.source, item, type_defaults),
        )
        if isinstance(exp.value, table.NeedsEval):
            comparison.outcome = "needs_eval"
        else:
            kind = None if value == MISSING else equivalence(exp.value, value)
            if kind is None:
                comparison.outcome = "mismatch"
            elif kind != "exact":
                comparison.outcome = "match_normalized"
                comparison.normalization = kind
        result.comparisons.append(comparison)


def _compare_order(result: SceneResult, legacy_tree: dict, next_order: dict) -> None:
    folders = [
        *FIXED_FOLDERS,
        *legacy_tree.get("setup", []),
        *legacy_tree.get("root", []),
    ]
    pairs = [("root", "main")] + [(f, f) for f in folders]
    for legacy_key, next_key in pairs:
        legacy_children = legacy_tree.get(legacy_key) or []
        next_children = next_order.get(next_key) or []
        if set(legacy_children) != set(next_children):
            result.order_failures.append(("membership", "render"))
        elif legacy_children != next_children:
            result.order_failures.append(("sequence", "editor"))


def _compare_scene_fields(result: SceneResult, exported: dict, migrated: dict) -> None:
    metadata = exported["dehydrated"].get("metadata", {})
    # The new app shows a single-line title and treats "Untitled" as no title.
    title = re.sub(r"\r\n|[\r\n]", " ", metadata.get("title", "")).strip()
    title = "" if title == "Untitled" else title
    raw_date = metadata.get("creationDate")
    for path, expected, actual, severity in (
        ("scene.title", title, migrated["title"], "editor"),
        (
            "scene.creation_date",
            None if raw_date is None else raw_date.replace('"', ""),
            migrated["creation_date"],
            "none",
        ),
    ):
        outcome = "match" if expected == actual else "mismatch"
        result.comparisons.append(
            Comparison(
                "scene",
                "SCENE",
                path,
                path,
                severity,
                outcome,
                expected=expected,
                actual=actual,
            )
        )


def _inventory(result: SceneResult, dehydrated: dict) -> None:
    for item in (dehydrated.get("folders") or {}).values():
        result.inventory.extend((FOLDER, prop) for prop in item if prop != "type")
    for group in ("mathGraphics", "mathSymbols"):
        for item in (dehydrated.get(group) or {}).values():
            if isinstance(item, dict):
                item_type = item.get("type", "?")
                result.inventory.extend(
                    (item_type, prop) for prop in item if prop != "type"
                )
