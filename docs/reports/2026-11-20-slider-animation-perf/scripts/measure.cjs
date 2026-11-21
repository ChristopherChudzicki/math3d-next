// Usage: node measure.cjs <outdir> <reps> <throttle> <label=url>...
// For each URL and rep: open a fresh page, wait for the canvas, let it settle,
// then for WINDOW_MS record rAF frame intervals and the main thread's task
// time (CDP Performance.getMetrics TaskDuration). Writes <outdir>/results.jsonl
// and a screenshot per label (last rep). Needs Playwright's full Chromium
// (`yarn playwright install chromium`); its default headless shell has no WebGPU.
const { chromium } = require("playwright");
const fs = require("fs");

const [outdir, repsArg, throttleArg, ...targets] = process.argv.slice(2);
const REPS = Number(repsArg);
const THROTTLE = Number(throttleArg);
const SETTLE_MS = Number(process.env.SETTLE_MS ?? 5000);
const WINDOW_MS = Number(process.env.WINDOW_MS ?? 5000);
fs.mkdirSync(outdir, { recursive: true });

const metric = async (cdp) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  const m = Object.fromEntries(metrics.map((x) => [x.name, x.value]));
  return {
    task: m.TaskDuration,
    script: m.ScriptDuration,
    heap: m.JSHeapUsedSize,
  };
};

(async () => {
  const browser = await chromium.launch({ channel: "chromium" });
  for (const t of targets) {
    const [label, url] = t.split(/=(.*)/s);
    for (let rep = 0; rep < REPS; rep += 1) {
      const context = await browser.newContext({
        viewport: { width: 1400, height: 900 },
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      try {
        const cdp = await context.newCDPSession(page);
        await cdp.send("Performance.enable");
        await page.goto(url);
        await page.waitForSelector("canvas", { timeout: 60000 });
        await page.waitForTimeout(SETTLE_MS);
        if (THROTTLE > 1) {
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: THROTTLE });
          await page.waitForTimeout(2000);
        }
        await page.evaluate(() => {
          window.__f = [];
          const f = (now) => {
            window.__f.push(now);
            requestAnimationFrame(f);
          };
          requestAnimationFrame(f);
        });
        const before = await metric(cdp);
        await page.waitForTimeout(WINDOW_MS);
        const after = await metric(cdp);
        const s = await page.evaluate(() => {
          const f = window.__f;
          const d = f
            .slice(1)
            .map((x, i) => x - f[i])
            .sort((a, b) => a - b);
          const span = f.at(-1) - f[0];
          return {
            frames: f.length - 1,
            span,
            fps: (f.length - 1) / (span / 1000),
            p50: d[d.length >> 1],
            p90: d[Math.floor(d.length * 0.9)],
            max: d.at(-1),
          };
        });
        if (THROTTLE > 1)
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const taskMs = (after.task - before.task) * 1000;
        const scriptMs = (after.script - before.script) * 1000;
        const row = {
          label,
          url,
          rep,
          throttle: THROTTLE,
          ...s,
          taskPerFrame: taskMs / s.frames,
          scriptPerFrame: scriptMs / s.frames,
          busy: taskMs / s.span,
          errors: errors.slice(0, 3),
        };
        fs.appendFileSync(
          `${outdir}/results.jsonl`,
          `${JSON.stringify(row)}\n`,
        );
        if (rep === REPS - 1)
          await page.screenshot({ path: `${outdir}/${label}.png` });
        console.log(
          `${label.padEnd(40)} rep ${rep} fps ${s.fps.toFixed(1).padStart(5)}  p50 ${s.p50.toFixed(1).padStart(5)}  p90 ${s.p90.toFixed(1).padStart(5)}  main ${row.taskPerFrame.toFixed(1).padStart(6)} ms/frame  busy ${(row.busy * 100).toFixed(0).padStart(3)}%${errors.length ? `  ERR ${errors[0]}` : ""}`,
        );
      } catch (e) {
        console.log(`${label} rep ${rep} ERROR ${e.message.split("\n")[0]}`);
      }
      await context.close();
    }
  }
  await browser.close();
})();
