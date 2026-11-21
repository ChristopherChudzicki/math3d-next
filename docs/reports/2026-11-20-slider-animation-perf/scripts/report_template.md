<!--
Template for README.md (scripts/build_report.py fills the {{…}} placeholders and drops this comment).
Hand-written per run: the date in the first paragraph, the Summary, the Screenshots caption, and the
machine and the math3d-react build comparison in Method.
-->

# math3d-next vs math3d-react: slider animation

Production: `next.math3d.org` at release `{{RELEASE}}` (`{{COMMIT}}`) vs `math3d.org`, measured 2026-11-20. Each scene animates a slider `T` on load, so the surface, its colors or the field change every frame.

## Summary

- **Native CPU (M1 Pro): math3d-next is ahead on color maps and implicit surfaces, and about even on solid-color surfaces and vector fields.**
  - Solid-color surfaces and vector fields: math3d-next uses 0–12% more main-thread time per frame; both hold 60 fps, except on the shell, where both run at about 56.
  - Color maps: math3d-next is ahead on all four color-mapped scenes; the 128 × 128 rainbow ripple runs at 60 fps on 11.9 ms against math3d-react's 56 fps on 17.6 ms.
  - Implicit surfaces: math3d-next holds 60 fps at 20 and 40 samples; math3d-react falls to 3.6 fps (gyroid, 40), using 3–43× more main-thread time.
- **With the CPU slowed 4×, math3d-next is behind on solid-color surfaces and vector fields**: 1.2–1.3× math3d-react's main-thread time, and fewer fps on the shell (13 vs 16) and the 4,000 arrows (48 vs 60). It stays ahead on color maps and implicit surfaces.
- _Likely causes of the 4× gap, from profiling not included here:_ evaluating the expression at every sample (math3d-react's mathjs 3 compiles each expression to JavaScript; math3d-next evaluates its parsed expression tree), and the store update and React re-render on each slider step.

## Native CPU speed

math3d-react vs math3d-next (three.js). Frames per second, and main-thread task time per frame (ms). Medians of {{N_X1}} runs, 5 s each, interleaved between the apps. 60 fps is the display cap, so where both hit it, main-thread time shows the headroom. Result compares frame rates when they differ by more than 10%, otherwise main-thread time when it differs by more than 15%: 🟢 math3d-next ahead, 🟢🟢 ahead with at least twice the frame rate or at most half the main-thread time, 🔵 even, 🟠 math3d-next behind. Run-to-run spread ((max − min) / median of ms per frame): {{SPREAD_X1}}.

{{TABLE_X1}}

## CPU slowed 4×

Chrome's CPU throttling, as a stand-in for a slower machine (roughly a low-end laptop against this M1 Pro). Medians of {{N_X4}} runs. Run-to-run spread: {{SPREAD_X4}}.

{{TABLE_X4}}

## Screenshots

Taken mid-animation at the end of the last native-speed run, so `T` differs between the two. math3d-react shows MathBox's loading spinner when it falls behind. At 40 samples its gyroid draws nothing and its fields show red underlines; we haven't looked into why.

{{SHOTS}}

## Method

- The scenes are saved on production in math3d-react's format, so both apps load the same ones; math3d-next translates each on load and draws with three.js (WebGPU). Scene keys (URL ids): `scripts/scene_keys.json`; definitions: `scripts/scenes.py`.
- Playwright with the full Chromium (real GPU) on an M1 Pro, on AC power, 1400 × 900 window at device pixel ratio 1, fresh page per run. Wait for the canvas, settle 5 s, then record 5 s of `requestAnimationFrame` intervals and the change in Chrome's `TaskDuration` metric.
- Main-thread ms per frame counts both apps' editor UI too (the slider readout updates each frame).
- math3d.org ran 3–10% faster than a local build of math3d-react.
- Raw results: `results/{x1,x4}/results.jsonl`, and `results/run.log` (one line per run, power source per round).
- To re-run: make a new folder `docs/reports/<date>-<name>/` holding only a copy of `scripts/` and `.gitignore`; from it run `scripts/run.sh`, edit the per-run text in `scripts/report_template.md` (listed in its leading comment), then run `python3 scripts/build_report.py <release>`.
