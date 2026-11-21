"""Writes README.md from report_template.md and results/{x1,x4}/results.jsonl.

python3 scripts/build_report.py <release>   e.g. v2026.11.21.1

Fills the tables with medians per scene and app, and converts the last x1 run's
screenshots to images/*.jpg (macOS `sips`). The summary and other per-run facts
are hand-written in the template (listed in its leading comment, which is
dropped from README.md). Warns about runs with page errors or missing runs.
"""

import json
import statistics
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RELEASE = sys.argv[1]
COMMIT = subprocess.run(
    ["git", "rev-parse", "--short=8", f"{RELEASE}^{{commit}}"],
    cwd=ROOT,
    capture_output=True,
    text=True,
    check=True,
).stdout.strip()

# (key, title, kind, detail, formula)
SCENES = [
    (
        "sphere_colormap",
        "Sphere, color map",
        "Parametric surface",
        "128 × 128, color map moves, geometry fixed",
        "3f(u,v), color g(u − T, v)",
    ),
    (
        "ripple_64",
        "Ripple",
        "Explicit surface",
        "64 × 64, solid color",
        "sin(2√(x²+y²) − T) / (1 + 0.3(x²+y²))",
    ),
    (
        "ripple_128_cmap",
        "Ripple, color map",
        "Explicit surface",
        "128 × 128, rainbow color map",
        "same surface; color (1 + sin(2√(x²+y²) − T)) / 2",
    ),
    (
        "ripple_256_cmap",
        "Ripple, color map",
        "Explicit surface",
        "256 × 256, rainbow color map",
        "same as above",
    ),
    (
        "torus_96_cmap",
        "Wavy torus, color map",
        "Parametric surface",
        "96 × 96, temperature color map",
        "[(2+cos v) cos u, (2+cos v) sin u, sin v + 0.4 sin(3u+T)]",
    ),
    (
        "shell_128",
        "Shell, user function",
        "Parametric surface",
        "128 × 128, solid color, f and A user-defined",
        "f(u,v) = e^{0.12u}[(1+A cos v) cos u, …], A = 0.6 + 0.3 sin T",
    ),
    (
        "implicit_sphere_20",
        "Moving sphere",
        "Implicit surface",
        "20 samples per axis",
        "(x − T)² + y² + z² = 4",
    ),
    (
        "implicit_sphere_40",
        "Moving sphere",
        "Implicit surface",
        "40 samples per axis",
        "(x − T)² + y² + z² = 4",
    ),
    (
        "gyroid_20",
        "Gyroid",
        "Implicit surface",
        "20 samples per axis",
        "sin(T x) cos y + sin y cos z + sin z cos x = 0",
    ),
    (
        "gyroid_40",
        "Gyroid",
        "Implicit surface",
        "40 samples per axis",
        "sin(T x) cos y + sin y cos z + sin z cos x = 0",
    ),
    (
        "field_10",
        "Vector field",
        "Vector field",
        "10 × 10 × 5 = 500 arrows",
        "[−y + 0.5 sin(z+T), x, 0.5 cos(x+T)]",
    ),
    (
        "field_20",
        "Vector field",
        "Vector field",
        "20 × 20 × 10 = 4,000 arrows",
        "[−y + 0.5 sin(z+T), x, 0.5 cos(x+T)]",
    ),
]


def load(kind: str) -> dict:
    runs = defaultdict(list)
    for line in (ROOT / "results" / kind / "results.jsonl").open():
        row = json.loads(line)
        app, scene = row["label"].split(".", 1)
        runs[(scene, app)].append(row)
        if row["errors"]:
            print(f"warning: {kind} {row['label']} had page errors: {row['errors']}")
    counts = {len(rows) for rows in runs.values()}
    if len(counts) > 1:
        print(f"warning: {kind} scenes have unequal run counts {sorted(counts)}")
    if {scene for scene, _ in runs} != {key for key, *_ in SCENES}:
        print(f"warning: {kind} scenes don't match SCENES in build_report.py")
    return runs


def stats(runs: dict) -> dict:
    out = {}
    for key, rows in runs.items():
        ms = [r["taskPerFrame"] for r in rows]
        out[key] = {
            "fps": statistics.median(r["fps"] for r in rows),
            "main": statistics.median(ms),
            "spread": (max(ms) - min(ms)) / statistics.median(ms),
            "n": len(rows),
        }
    return out


def fmt_fps(x: float) -> str:
    return f"{x:.0f}" if x >= 10 else f"{x:.1f}"


def verdict(r: dict, n: dict) -> str:
    # Frame rates more than 10% apart decide; otherwise (including both at the
    # 60 fps cap) main-thread time more than 15% apart does.
    fps, ms = n["fps"] / r["fps"], n["main"] / r["main"]
    if fps > 1.1 or (fps >= 0.9 and ms < 1 / 1.15):
        if fps >= 2 or ms <= 0.5:
            return "🟢🟢 math3d-next ahead, 2× or more"
        return "🟢 math3d-next ahead"
    if fps < 0.9 or ms > 1.15:
        return "🟠 math3d-next behind"
    return "🔵 even"


def spread(m: dict) -> str:
    def span(app: str) -> str:
        values = [v["spread"] * 100 for (_, a), v in m.items() if a == app]
        return f"{min(values):.0f}–{max(values):.0f}%"

    return f"math3d-next {span('next')}, math3d-react {span('react')}"


def table(m: dict) -> str:
    lines = [
        "| Scene | math3d-react fps | math3d-next fps | math3d-react ms | math3d-next ms | Result |",
        "| --- | ---: | ---: | ---: | ---: | --- |",
    ]
    for key, title, kind, detail, _ in SCENES:
        r, n = m[(key, "react")], m[(key, "next")]
        lines.append(
            f"| **{title}**<br>{kind} · {detail} | {fmt_fps(r['fps'])} | {fmt_fps(n['fps'])} "
            f"| {r['main']:.1f} | {n['main']:.1f} | {verdict(r, n)} |"
        )
    return "\n".join(lines)


def shots(m: dict) -> str:
    out = []
    for key, title, kind, detail, formula in SCENES:
        r, n = m[(key, "react")], m[(key, "next")]
        out.append(
            f"### {title}\n\n{kind} · {detail} · `{formula}`\n\n"
            "| math3d-react | math3d-next |\n| --- | --- |\n"
            f"| ![math3d-react: {title}, {detail}](images/react.{key}.jpg) "
            f"| ![math3d-next: {title}, {detail}](images/next.{key}.jpg) |\n"
            f"| {fmt_fps(r['fps'])} fps · {r['main']:.1f} ms/frame "
            f"| {fmt_fps(n['fps'])} fps · {n['main']:.1f} ms/frame |"
        )
    return "\n\n".join(out)


def convert_screenshots() -> None:
    (ROOT / "images").mkdir(exist_ok=True)
    for key, *_ in SCENES:
        for app in ("react", "next"):
            src = ROOT / "results" / "x1" / f"{app}.{key}.png"
            if not src.exists():
                print(f"warning: no screenshot {src.name}")
                continue
            subprocess.run(
                [
                    "sips",
                    "-s",
                    "format",
                    "jpeg",
                    "-s",
                    "formatOptions",
                    "72",
                    "-Z",
                    "800",
                ]
                + [str(src), "--out", str(ROOT / "images" / f"{app}.{key}.jpg")],
                check=True,
                capture_output=True,
            )


x1, x4 = stats(load("x1")), stats(load("x4"))
convert_screenshots()
template = (ROOT / "scripts" / "report_template.md").read_text()
template = template[template.index("-->") + len("-->") :].lstrip()
report = (
    template.replace("{{RELEASE}}", RELEASE)
    .replace("{{COMMIT}}", COMMIT)
    .replace("{{N_X1}}", str(min(v["n"] for v in x1.values())))
    .replace("{{N_X4}}", str(min(v["n"] for v in x4.values())))
    .replace("{{SPREAD_X1}}", spread(x1))
    .replace("{{SPREAD_X4}}", spread(x4))
    .replace("{{TABLE_X1}}", table(x1))
    .replace("{{TABLE_X4}}", table(x4))
    .replace("{{SHOTS}}", shots(x1))
)
(ROOT / "README.md").write_text(report)
# As the repo's pre-commit hook would, so a rebuild doesn't churn the file.
subprocess.run(["npx", "prettier", "--write", "README.md"], cwd=ROOT, check=True)
print("wrote README.md")
