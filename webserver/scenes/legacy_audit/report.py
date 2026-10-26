"""Aggregate per-scene comparison results into the pass-1 report.

The report is committed, so it must hold aggregates only: no scene keys and
no user-authored values. Example values appear only when they are constants
or math3d-react defaults (see `_safe`).
"""

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any

from scenes.legacy_audit.compare import SceneResult, cluster_id, crash_template

RENDER = frozenset({"render"})
RENDER_AND_EDITOR = frozenset({"render", "editor"})
SAFE_LITERALS = {"xy", "yz", "zx", "x", "y", "z", "true", "false", ""}


def _cell(text: str) -> str:
    """Escape pipes, which end a Markdown table cell even inside backticks."""
    return text.replace("|", "\\|")


def _safe(value: Any, defaults: set[str]) -> str:
    """A value fit for a committed report, or just its shape."""
    if value is None or isinstance(value, bool):
        return repr(value)
    if isinstance(value, str) and (value in SAFE_LITERALS or value in defaults):
        return repr(value)
    if isinstance(value, int | float):
        return "number"
    if isinstance(value, str):
        return f"str({len(value)})"
    return type(value).__name__


@dataclass
class Totals:
    scenes: int = 0
    weight: int = 0
    weight_plus_one: int = 0

    def add(self, w: int) -> None:
        self.scenes += 1
        self.weight += w
        self.weight_plus_one += w + 1


@dataclass
class Aggregate:
    all: Totals = field(default_factory=Totals)
    legacy_broken: Totals = field(default_factory=Totals)
    clean: Totals = field(default_factory=Totals)
    strict_clean: Totals = field(default_factory=Totals)
    verified_clean: Totals = field(default_factory=Totals)
    crashes: Counter = field(default_factory=Counter)
    crash_weight: Counter = field(default_factory=Counter)
    cluster_scenes: Counter = field(default_factory=Counter)
    cluster_weight: Counter = field(default_factory=Counter)
    cluster_severity: dict[str, str] = field(default_factory=dict)
    cluster_examples: dict[str, Counter] = field(
        default_factory=lambda: defaultdict(Counter)
    )
    outcomes: Counter = field(default_factory=Counter)
    normalizations: Counter = field(default_factory=Counter)
    needs_eval: Counter = field(default_factory=Counter)
    expectation_errors: Counter = field(default_factory=Counter)
    unknown_properties: Counter = field(default_factory=Counter)
    flags: Counter = field(default_factory=Counter)
    weights: list[int] = field(default_factory=list)
    scene_clusters: list[tuple[int, frozenset[str]]] = field(default_factory=list)

    def add(self, r: SceneResult, default_values: set[str]) -> dict:
        w = r.times_accessed
        self.all.add(w)
        self.weights.append(w)
        for item_type, prop in set(r.unknown_properties):
            self.unknown_properties[(item_type, prop)] += 1
        for flag in r.flags:
            self.flags[flag] += 1
        if r.legacy_broken:
            self.legacy_broken.add(w)
            return {"verdict": "legacy_broken", "reasons": r.legacy_broken}
        if r.crash:
            self.crashes[r.crash] += 1
            self.crash_weight[r.crash] += w
        for c in r.comparisons:
            self.outcomes[c.outcome] += 1
            if c.outcome == "match_normalized":
                self.normalizations[c.normalization] += 1
            elif c.outcome == "needs_eval":
                self.needs_eval[(c.item_type, c.path)] += 1
            elif c.outcome == "expectation_error":
                # The message may quote a user's value; keep only its shape.
                error_type, _, message = str(c.expected).partition(": ")
                template = crash_template({"type": error_type, "message": message})
                self.expectation_errors[(c.item_type, template)] += 1
            elif c.outcome == "mismatch":
                cid = cluster_id(c)
                self.cluster_severity[cid] = c.severity
                self.cluster_examples[cid][
                    (_safe(c.expected, default_values), _safe(c.actual, default_values))
                ] += 1
        for kind, item_type, _item_id, severity in r.item_failures:
            self.cluster_severity[f"item|{kind}|{item_type}"] = severity
        for kind, severity in r.order_failures:
            self.cluster_severity[f"order|{kind}"] = severity
        if r.crash:
            self.cluster_severity[f"crash|{r.crash}"] = "render"
        render = r.clusters(RENDER)
        everything = r.clusters(RENDER_AND_EDITOR)
        for cid in r.clusters(frozenset({"render", "editor", "none"})):
            self.cluster_scenes[cid] += 1
            self.cluster_weight[cid] += w
        if not render:
            self.clean.add(w)
            if not any(
                c.outcome in ("needs_eval", "expectation_error") for c in r.comparisons
            ):
                self.verified_clean.add(w)
        if not everything:
            self.strict_clean.add(w)
        self.scene_clusters.append((w, frozenset(render)))
        return {
            "verdict": "clean" if not render else "unclean",
            "strict_clean": not everything,
            "clusters": sorted(everything),
        }


def _pct(part: float, whole: float) -> str:
    return "n/a" if not whole else f"{100 * part / whole:.2f}%"


def fix_curve(agg: Aggregate, k_max: int = 12) -> list[tuple[str, float, float]]:
    """Clean share after fixing render clusters 1..k, ranked by weight."""
    ranked = [
        cid
        for cid, _ in agg.cluster_weight.most_common()
        if agg.cluster_severity.get(cid) == "render"
    ][:k_max]
    total_n = len(agg.scene_clusters)
    total_w = sum(w for w, _ in agg.scene_clusters)
    curve = []
    fixed: set[str] = set()
    for cid in ranked:
        fixed.add(cid)
        n = sum(1 for _, cs in agg.scene_clusters if cs <= fixed)
        w = sum(w for w, cs in agg.scene_clusters if cs <= fixed)
        curve.append(
            (cid, n / total_n if total_n else 0, w / total_w if total_w else 0)
        )
    return curve


def concentration(agg: Aggregate) -> list[tuple[int, str]]:
    ordered = sorted(agg.weights, reverse=True)
    total = sum(ordered)
    return [(n, _pct(sum(ordered[:n]), total)) for n in (1, 10, 100, 1000)]


def render_markdown(agg: Aggregate, meta: dict[str, str]) -> str:
    a = agg.all
    judged_n = a.scenes - agg.legacy_broken.scenes
    judged_w = a.weight - agg.legacy_broken.weight
    judged_w1 = a.weight_plus_one - agg.legacy_broken.weight_plus_one
    lines = [
        f"# Legacy audit, pass 1 report — {meta['date']}",
        "",
        "Method: [pass-1 spec](../2026-10-23-pass1-spec.md). Aggregates only; no scene keys or user values.",
        "",
        "| | |",
        "|---|---|",
        *(f"| {k} | {v} |" for k, v in meta.items() if k != "date"),
        f"| Legacy scenes | {a.scenes:,} |",
        f"| Total weight (`times_accessed`) | {a.weight:,.0f} |",
        f"| Broken in math3d-react too (excluded) | {agg.legacy_broken.scenes:,} |",
        "",
        "## Headline: pass-1-clean scenes",
        "",
        (
            "Clean = no crash, no missing/extra item, no folder-membership change, and no `render`-severity "
            "mismatch. Strict also counts `editor`-severity mismatches (descriptions, collapsed state, item order). "
            "Verified also excludes scenes with a comparison pass 1 can't check (`needs_eval`, `expectation_error`)."
        ),
        "",
        "| | Scenes | Weighted | Weighted (+1) |",
        "|---|---|---|---|",
        (
            f"| Clean | {_pct(agg.clean.scenes, judged_n)} | {_pct(agg.clean.weight, judged_w)} | "
            f"{_pct(agg.clean.weight_plus_one, judged_w1)} |"
        ),
        (
            f"| Strict clean | {_pct(agg.strict_clean.scenes, judged_n)} | "
            f"{_pct(agg.strict_clean.weight, judged_w)} | {_pct(agg.strict_clean.weight_plus_one, judged_w1)} |"
        ),
        (
            f"| Verified clean | {_pct(agg.verified_clean.scenes, judged_n)} | "
            f"{_pct(agg.verified_clean.weight, judged_w)} | {_pct(agg.verified_clean.weight_plus_one, judged_w1)} |"
        ),
        "",
        "Weight concentration (share of all `times_accessed` held by the top N scenes): "
        + ", ".join(f"top {n}: {share}" for n, share in concentration(agg))
        + ".",
        "",
        "## Crash census",
        "",
        "| Scenes | Weight | Error |",
        "|---|---|---|",
        *(
            f"| {n:,} | {agg.crash_weight[t]:,.0f} | `{_cell(t)}` |"
            for t, n in agg.crashes.most_common()
        ),
        "",
        "## Root causes, by weighted impact",
        "",
        (
            "`legacy-default` means the legacy value was math3d-react's default (so it was absent from the saved "
            "blob); `legacy-custom` means the user set it. Examples show expected → actual, with user values "
            "reduced to their shape."
        ),
        "",
        "| Severity | Scenes | Weight | Cluster | Examples (expected → actual) |",
        "|---|---|---|---|---|",
    ]
    for cid, w in agg.cluster_weight.most_common(40):
        examples = "; ".join(
            f"`{e}` → `{x}` ×{n:,}"
            for (e, x), n in agg.cluster_examples.get(cid, Counter()).most_common(2)
        )
        lines.append(
            f"| {agg.cluster_severity.get(cid, '?')} | {agg.cluster_scenes[cid]:,} | {w:,.0f} | `{_cell(cid)}` | {_cell(examples)} |"
        )
    lines += [
        "",
        "## Clean share if the top render clusters were fixed",
        "",
        "| Fix through | Scenes clean | Weighted clean |",
        "|---|---|---|",
        *(f"| `{_cell(cid)}` | {n:.2%} | {w:.2%} |" for cid, n, w in fix_curve(agg)),
        "",
        "## Comparison outcomes",
        "",
        "| Outcome | Comparisons |",
        "|---|---|",
        *(f"| {o} | {n:,} |" for o, n in agg.outcomes.most_common()),
        "",
        "Normalizations used: "
        + (
            ", ".join(f"`{k}` ×{n:,}" for k, n in agg.normalizations.most_common())
            or "none"
        )
        + ".",
        "",
        "Deferred to pass 2/3 (`needs_eval`): "
        + (
            ", ".join(
                f"`{t}.{p}` ×{n:,}" for (t, p), n in agg.needs_eval.most_common(10)
            )
            or "none"
        )
        + ".",
        "",
        "Table errors (`expectation_error`, an unexpected legacy value the table couldn't handle): "
        + (
            ", ".join(
                f"`{t}` {_cell(e)} ×{n:,}"
                for (t, e), n in agg.expectation_errors.most_common(10)
            )
            or "none"
        )
        + ".",
        "",
        "## Properties math3d-react ignores (`unknown_property`)",
        "",
        "| Type | Property | Scenes |",
        "|---|---|---|",
        *(
            f"| {t} | `{_cell(p)}` | {n:,} |"
            for (t, p), n in agg.unknown_properties.most_common(25)
        ),
        "",
        "## Pass-3 flags",
        "",
        *(f"- `{f}`: {n:,} scenes" for f, n in agg.flags.most_common()),
        "",
    ]
    return "\n".join(lines)
