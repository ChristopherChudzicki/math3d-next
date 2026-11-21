# math3d-next vs math3d-react: slider animation

Production: `next.math3d.org` at release `{{RELEASE}}` (`{{COMMIT}}`) vs `math3d.org`, measured 2026-11-20. Each scene animates a slider `T` on load; the surface or field changes every frame.

## Summary

- **Native CPU (M1 Pro): math3d-next is ahead on color maps and implicit surfaces, and even on the rest.** On solid-color surfaces and vector fields math3d-next uses 0–12% more main-thread time per frame; both hold 60 fps, and both run at about 56 fps on the shell.
- **Color maps:** math3d-next is ahead on all four color-mapped scenes; the 128 × 128 rainbow ripple runs at 60 fps on 11.9 ms against math3d-react's 56 fps on 17.6 ms.
- **Implicit surfaces:** math3d-next holds 60 fps at 20 and 40 samples; math3d-react falls to 3.6 fps (gyroid, 40), using 3–43× more main-thread time.
- **With the CPU slowed 4×, math3d-next is behind on solid-color surfaces and vector fields**, at 1.2–1.3× math3d-react's main-thread time (4,000 arrows: 48 vs 60 fps). That is the remaining gap: mostly evaluating the function at every sample (mathjs 15 against mathjs 3's generated code) and the per-tick store and React update.

## Native CPU speed

math3d-react vs math3d-next (three.js). Frames per second, and main-thread task time per frame (ms). Medians of {{N_X1}} runs, 5 s each, interleaved between the apps. 60 fps is the display cap, so where both hit it, main-thread time shows the headroom.

{{TABLE_X1}}

## CPU slowed 4×

Chrome's CPU throttling, as a stand-in for a slower machine (roughly a low-end Chromebook against this M1 Pro). Medians of {{N_X4}} runs. Within this session, runs of the same scene agreed to within about 2%; separate sessions on this machine have differed by up to 15% on the lighter scenes, for both apps.

{{TABLE_X4}}

## Screenshots

Taken mid-animation at the end of the last native-speed run, so `T` differs between the two. math3d-react shows MathBox's loading spinner when it falls behind; at 40 samples its gyroid draws nothing.

{{SHOTS}}

## Method

- The scenes are legacy scenes saved to production on 2026-11-20, so both apps load the same ones; math3d-next translates each on load and draws with three.js (WebGPU). Keys: `scripts/scene_keys.json`; definitions: `scripts/scenes.py`.
- Playwright with the full Chromium (real GPU) on an M1 Pro, on AC power, 1400 × 900 window at device pixel ratio 1, fresh page per run. Wait for the canvas, settle 5 s, then record 5 s of `requestAnimationFrame` intervals and the change in Chrome's `TaskDuration` metric.
- Main-thread ms per frame counts both apps' editor UI too (the slider readout updates each frame).
- Local production builds of the same commit measured within 5% of production for math3d-next; math3d.org measured 3–10% faster than a local math3d-react build.
- Raw results: `results/{x1,x4}/results.jsonl`, and `results/run.log` (one line per run, power source per round).
- To re-run, copy this folder to `docs/reports/<date>-<name>/`, then from it run `scripts/run.sh react` (or `scripts/run.sh` for math3d-next only), edit the summary in `scripts/report_template.md`, and run `python3 scripts/build_report.py <release>`.
