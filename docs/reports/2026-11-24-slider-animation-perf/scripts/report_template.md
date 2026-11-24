<!--
Template for README.md (scripts/build_report.py fills the {{…}} placeholders and drops this comment).
Hand-written per run: the date in the first paragraph, the Summary, the Screenshots caption, and the
machine and the math3d-react build comparison in Method.
-->

# math3d-next vs math3d-react: slider animation

Production: `next.math3d.org` at release `{{RELEASE}}` (`{{COMMIT}}`) vs `math3d.org`, measured 2026-11-24. Each scene animates a slider `T` on load, so the surface, its colors or the field change every frame.

## Summary

- **Native CPU (M1 Pro): math3d-next is ahead on color maps, implicit surfaces and the shell, and even on the ripple and the vector fields.**
  - Solid-color surfaces and vector fields: on the shell math3d-next uses 58% less main-thread time per frame (60 fps vs 56); on the 64 × 64 ripple and both vector fields it uses 1–10% less, at 60 fps in both apps.
  - Color maps: math3d-next uses 44–55% less main-thread time on all four color-mapped scenes, and has the higher frame rate on two (sphere 60 vs 53, 256 × 256 ripple 36 vs 19); the 128 × 128 ripple runs at 60 vs 56 and the torus at 60 in both.
  - Implicit surfaces: math3d-next holds 60 fps at 20 and 40 samples; math3d-react falls to 3.6 fps (gyroid, 40), using 3–42× more main-thread time.
- **With the CPU slowed 4×, math3d-next is ahead or even on every scene but the 500 arrows**, where it uses 1.2× math3d-react's main-thread time (11.1 vs 9.2 ms) and both hold 60 fps.
  - Solid-color surfaces and vector fields: the shell runs at 39 fps vs 16; the 64 × 64 ripple and the 4,000 arrows are within 6% in main-thread time, at 60 fps.
  - Color maps: math3d-next uses 40–53% less main-thread time, with 1.7–2.1× the frame rate.
  - Implicit surfaces: math3d-next runs at 42–60 fps; math3d-react at 0.9–18.
- **Since the [2026-11-20 report](../2026-11-20-slider-animation-perf/README.md)** (release `v2026.11.21.1`), surfaces and vector fields evaluate their expression over all samples at once ([#1563](https://github.com/ChristopherChudzicki/math3d-next/pull/1563)). math3d-next at 4×, then and now:
  - Shell: 75.1 → 25.9 ms per frame (13 → 39 fps).
  - 4,000 arrows: 20.9 → 14.3 ms (48 → 60 fps).
  - 64 × 64 ripple: 17.0 → 13.7 ms (58 → 60 fps).
  - The three color-mapped surfaces whose shape moves: 21–41% less main-thread time (torus 44.6 → 26.5 ms, 22 → 38 fps).
- _Likely cause of the remaining gap on the 500 arrows, from profiling for the 2026-11-20 report, not repeated here:_ the store update and React re-render on each slider step.

## Native CPU speed

math3d-react vs math3d-next (three.js). Frames per second, and main-thread task time per frame (ms). Medians of {{N_X1}} runs, 5 s each, interleaved between the apps. 60 fps is the display cap, so where both hit it, main-thread time shows the headroom. Result compares frame rates: 🟢 math3d-next more than 10% higher, 🟢🟢 at least twice as high, 🔵 within 10% (with math3d-next's main-thread time against math3d-react's when it differs by more than 15%), 🟠 more than 10% lower. Run-to-run spread ((max − min) / median of ms per frame): {{SPREAD_X1}}.

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
- math3d-react's medians are within 6% of the 2026-11-20 report's, which found math3d.org 3–10% faster than a local build of math3d-react.
- Raw results: `results/{x1,x4}/results.jsonl`, and `results/run.log` (one line per run, power source per round).
- To re-run: make a new folder `docs/reports/<date>-<name>/` holding only a copy of `scripts/` and `.gitignore`; from it run `scripts/run.sh`, edit the per-run text in `scripts/report_template.md` (listed in its leading comment), then run `python3 scripts/build_report.py <release>`.
