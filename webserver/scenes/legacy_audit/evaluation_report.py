"""Aggregate pass-2 scene results into the committed report.

The report holds aggregates only: no scene keys, and error messages only as
templates (evaluation.template). Example keys for filing tasks go to
examples.json, which stays with the other generated files.
"""

from __future__ import annotations

import math
from collections import Counter, defaultdict
from dataclasses import dataclass, field

from scenes.legacy_audit.evaluation import (
    BAD,
    MISSING,
    SEVERITY_RANK,
    SceneResult,
    cluster_key,
    shape,
)
from scenes.legacy_audit.report import Totals, _cell, _pct, concentration, fix_curve

EXAMPLES_PER_CLUSTER = 5


@dataclass
class Aggregate:
    all: Totals = field(default_factory=Totals)
    excluded: Counter = field(default_factory=Counter)
    excluded_totals: Totals = field(default_factory=Totals)
    clean: Totals = field(default_factory=Totals)
    strict_clean: Totals = field(default_factory=Totals)
    verified_clean: Totals = field(default_factory=Totals)
    clean_both: Totals = field(default_factory=Totals)
    both_judged: Totals = field(default_factory=Totals)
    crashes: Counter = field(default_factory=Counter)
    outcomes: Counter = field(default_factory=Counter)
    unsure: Counter = field(default_factory=Counter)
    cluster_scenes: Counter = field(default_factory=Counter)
    cluster_weight: Counter = field(default_factory=Counter)
    cluster_pairs: Counter = field(default_factory=Counter)
    cluster_severity: dict[str, str] = field(default_factory=dict)
    cluster_shapes: dict[str, Counter] = field(
        default_factory=lambda: defaultdict(Counter)
    )
    cluster_features: dict[str, Counter] = field(
        default_factory=lambda: defaultdict(Counter)
    )
    examples: dict[str, list[tuple[int, str]]] = field(
        default_factory=lambda: defaultdict(list)
    )
    lenient: Counter = field(default_factory=Counter)  # next_only_ok details
    allowlisted: Counter = field(default_factory=Counter)
    unpaired: Counter = field(default_factory=Counter)
    histogram: Counter = field(default_factory=Counter)
    feature_differ: Counter = field(default_factory=Counter)
    feature_equal: Counter = field(default_factory=Counter)
    differ_roots: int = 0
    equal_pairs: int = 0
    weights: list[int] = field(default_factory=list)
    scene_clusters: list[tuple[int, frozenset[str]]] = field(default_factory=list)

    def add(self, r: SceneResult, pass1_verdict: str | None) -> dict:
        w = r.times_accessed
        self.all.add(w)
        self.weights.append(w)
        if r.excluded:
            self.excluded[r.excluded] += 1
            self.excluded_totals.add(w)
            return {"verdict": "excluded", "reason": r.excluded}
        render: set[str] = set()
        everything: set[str] = set()
        counted: set[str] = set()
        unsure = False
        if r.crash:
            cid = f"crash|{r.crash}"
            self.crashes[r.crash] += 1
            self.cluster_severity[cid] = "render"
            render.add(cid)
            everything.add(cid)
            counted.add(cid)
        for side, item_type, name, reason in r.unpaired:
            self.unpaired[(side, item_type, name, reason)] += 1
        for p in r.pairs:
            self.outcomes[p.outcome] += 1
            if p.outcome == "unsure":
                self.unsure[p.detail] += 1
                unsure = unsure or p.spec.severity == "render"
            if p.verdict and p.verdict.compared and p.outcome in ("equal", "differ"):
                self.histogram[_decade(p.verdict.error)] += 1
            if p.outcome == "equal":
                self.equal_pairs += 1
                self.feature_equal.update(p.features)
            if p.outcome == "next_only_ok":
                self.lenient[f"{p.spec.item_type}|{p.spec.next_field}|{p.detail}"] += 1
            if p.outcome not in BAD or not p.root:
                continue
            if p.outcome == "differ":
                self.differ_roots += 1
                self.feature_differ.update(p.features)
            cid = cluster_key(p)
            if p.allowlisted:
                self.allowlisted[(cid, p.allowlisted)] += 1
                continue
            self.cluster_pairs[cid] += 1
            counted.add(cid)
            self.cluster_severity[cid] = max(
                self.cluster_severity.get(cid, "none"),
                p.spec.severity,
                key=SEVERITY_RANK.__getitem__,
            )
            self.cluster_shapes[cid][
                (_shape(p.legacy.value), _shape(p.next.value))
            ] += 1
            self.cluster_features[cid].update(p.features)
            if p.outcome == "both_error":
                continue
            if p.spec.severity == "render":
                render.add(cid)
            if p.spec.severity in ("render", "editor"):
                everything.add(cid)
        for cid in counted:
            self.cluster_scenes[cid] += 1
            self.cluster_weight[cid] += w
            examples = self.examples[cid]
            examples.append((w, r.key))
            if len(examples) > 4 * EXAMPLES_PER_CLUSTER:
                examples.sort(reverse=True)
                del examples[EXAMPLES_PER_CLUSTER:]
        if not render:
            self.clean.add(w)
            if not unsure:
                self.verified_clean.add(w)
        if not everything:
            self.strict_clean.add(w)
        if pass1_verdict is not None:
            self.both_judged.add(w)
            if pass1_verdict == "clean" and not render:
                self.clean_both.add(w)
        self.scene_clusters.append((w, frozenset(render)))
        return {
            "verdict": "clean" if not render else "unclean",
            "strict_clean": not everything,
            "verified_clean": not render and not unsure,
            "clusters": sorted(everything),
        }

    def top_examples(self) -> dict[str, list[str]]:
        return {
            cid: [
                key for _, key in sorted(examples, reverse=True)[:EXAMPLES_PER_CLUSTER]
            ]
            for cid, examples in self.examples.items()
        }


def _shape(value: object) -> str:
    return "—" if value is MISSING else shape(value)


def _decade(error: float) -> str:
    if error == 0:
        return "0"
    if error >= 1:
        return "≥1"
    return f"1e{math.floor(math.log10(error))}"


def _decade_order(label: str) -> float:
    if label == "0":
        return -math.inf
    if label == "≥1":
        return math.inf
    return float(label[2:])


def fixable_curve(agg: Aggregate) -> list[tuple[str, float, float]]:
    """The fix curve over clusters that make a scene unclean: `both_error`
    is invalid source, not a fixable cause."""
    return fix_curve(agg, keep=lambda cid: "|both_error|" not in cid)


def _cluster_table(agg: Aggregate, keep, limit: int) -> list[str]:
    lines = [
        "| Severity | Scenes | Weight | Pairs | Type · field | Outcome | Detail | Shapes | Features |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    rows = 0
    for cid, w in agg.cluster_weight.most_common():
        if cid.startswith("crash|"):
            continue
        item_type, next_field, outcome, detail = cid.split("|", 3)
        if not keep(outcome):
            continue
        shapes = "; ".join(
            f"{x} → {y} ×{n:,}" for (x, y), n in agg.cluster_shapes[cid].most_common(2)
        )
        features = ", ".join(f for f, _ in agg.cluster_features[cid].most_common(4))
        lines.append(
            f"| {agg.cluster_severity.get(cid, '?')} | {agg.cluster_scenes[cid]:,} | {w:,.0f} | "
            f"{agg.cluster_pairs[cid]:,} | {item_type}.{next_field} | {outcome} | `{_cell(detail)}` | "
            f"{_cell(shapes)} | {_cell(features)} |"
        )
        rows += 1
        if rows >= limit:
            break
    return lines


def render_markdown(agg: Aggregate, meta: dict[str, str]) -> str:
    a = agg.all
    judged_n = a.scenes - agg.excluded_totals.scenes
    judged_w = a.weight - agg.excluded_totals.weight

    def row(name: str, t: Totals, n: int, w: int) -> str:
        return f"| {name} | {_pct(t.scenes, n)} | {_pct(t.weight, w)} |"

    lines = [
        f"# Legacy audit, pass 2 report — {meta['date']}",
        "",
        "Method: [pass-2 spec](../2026-10-29-pass2-spec.md). Aggregates only; no scene keys or user values.",
        "",
        "| | |",
        "|---|---|",
        *(f"| {k} | {v} |" for k, v in meta.items() if k != "date"),
        f"| Legacy scenes | {a.scenes:,} |",
        f"| Total weight (`times_accessed`) | {a.weight:,.0f} |",
        *(
            f"| Excluded: {reason} | {n:,} |"
            for reason, n in agg.excluded.most_common()
        ),
        "",
        "## Headline",
        "",
        (
            "Pass-2-clean: no root `regression` or `differ` at `render` severity, outside the allowlist. "
            "Strict also counts `editor` severity; verified also has no `unsure` at `render` severity. "
            "`both_error` (invalid source) and `next_only_ok` count as clean."
        ),
        "",
        "| | Scenes | Weighted |",
        "|---|---|---|",
        row("Pass-2-clean", agg.clean, judged_n, judged_w),
        row("Strict", agg.strict_clean, judged_n, judged_w),
        row("Verified", agg.verified_clean, judged_n, judged_w),
        row(
            "Clean through passes 1 and 2",
            agg.clean_both,
            agg.both_judged.scenes,
            agg.both_judged.weight,
        ),
        "",
        "Weight concentration: "
        + ", ".join(f"top {n}: {share}" for n, share in concentration(agg.weights))
        + ".",
        "",
        "## Pair outcomes",
        "",
        "| Outcome | Pairs |",
        "|---|---|",
        *(f"| {o} | {n:,} |" for o, n in agg.outcomes.most_common()),
        "",
        "`unsure` causes: "
        + ", ".join(f"`{c}` ×{n:,}" for c, n in agg.unsure.most_common())
        + ".",
        "",
        "## Root causes, by weighted impact",
        "",
        (
            "Roots only: a `differ`, `regression` or `both_error` pair none of whose transitive "
            "dependencies, outside its own cycle, failed or is in such a pair. "
            "Shapes are legacy → next; features are math3d-next's."
        ),
        "",
        *_cluster_table(agg, lambda outcome: outcome != "both_error", 50),
        "",
        "## Invalid source in both apps (`both_error` roots)",
        "",
        "These don't make a scene unclean. The detail is math3d-next's error.",
        "",
        *_cluster_table(agg, lambda outcome: outcome == "both_error", 15),
    ]
    lines += [
        "",
        "## Clean share if the top render clusters were fixed",
        "",
        "| Fix through | Scenes clean | Weighted clean |",
        "|---|---|---|",
        *(
            f"| `{_cell(cid)}` | {n:.2%} | {w:.2%} |"
            for cid, n, w in fixable_curve(agg)
        ),
        "",
        "## Feature lift",
        "",
        (
            f"Share of `differ` roots ({agg.differ_roots:,}) using each feature, against its share "
            f"of `equal` pairs ({agg.equal_pairs:,})."
        ),
        "",
        "| Feature | Differ roots | Equal pairs | Lift |",
        "|---|---|---|---|",
    ]
    lifts = []
    for feat, n in agg.feature_differ.items():
        d = n / agg.differ_roots if agg.differ_roots else 0
        e = agg.feature_equal[feat] / agg.equal_pairs if agg.equal_pairs else 0
        lifts.append((d / e if e else math.inf, feat, d, e))
    for lift, feat, d, e in sorted(lifts, reverse=True)[:25]:
        lines.append(f"| `{feat}` | {d:.2%} | {e:.3%} | {lift:.1f} |")
    lines += [
        "",
        "## Relative error per compared pair",
        "",
        (
            "Largest relative error beyond atol among the numbers each `equal` or `differ` pair "
            "compares, by decade. Every `equal` pair is at or below rtol."
        ),
        "",
        "| Error | Pairs |",
        "|---|---|",
        *(
            f"| {b} | {agg.histogram[b]:,} |"
            for b in sorted(agg.histogram, key=_decade_order)
        ),
        "",
        "## math3d-next more lenient (`next_only_ok`)",
        "",
        "| Pairs | Type · field · legacy error |",
        "|---|---|",
        *(f"| {n:,} | `{_cell(k)}` |" for k, n in agg.lenient.most_common(15)),
        "",
        "## Allowlisted",
        "",
        *(
            [
                f"- `{_cell(cid)}` ×{n:,}: {reason}"
                for (cid, reason), n in agg.allowlisted.most_common()
            ]
            or ["None."]
        ),
        "",
        "## Unpaired fields",
        "",
        "| Side | Type | Field | Reason | Fields |",
        "|---|---|---|---|---|",
        *(
            f"| {side} | {t} | {f} | {_cell(reason)} | {n:,} |"
            for (side, t, f, reason), n in sorted(
                agg.unpaired.items(), key=lambda kv: (-kv[1], kv[0])
            )
            if not reason.startswith("known")
        ),
        "",
        "Known-unpaired fields: "
        + f"{sum(n for k, n in agg.unpaired.items() if k[3].startswith('known')):,}.",
        "",
        "## math3d-next evaluator crashes",
        "",
        *(
            [f"- `{_cell(t)}` ×{n:,}" for t, n in agg.crashes.most_common()]
            or ["None."]
        ),
        "",
    ]
    return "\n".join(lines)


def unaccounted(agg: Aggregate) -> list[tuple[str, str, str, int]]:
    return sorted(
        (
            (side, t, f, n)
            for (side, t, f, reason), n in agg.unpaired.items()
            if reason == "unaccounted"
        ),
        key=lambda x: -x[3],
    )
