// Usage: node scripts/measure.cjs <outdir> <throttle> <app=baseUrl>...
// One run per scene in scene_keys.json and app, scenes outermost so the apps
// alternate. Each run opens a fresh page, waits for the canvas, settles 5 s,
// then for 5 s records rAF frame intervals and the main thread's task time
// (CDP Performance.getMetrics TaskDuration). Appends a row per run to
// <outdir>/results.jsonl and screenshots each page to <outdir>/<app>.<scene>.png.
// Needs Playwright's full Chromium (`yarn playwright install chromium`); its
// default headless shell has no WebGPU.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const [outdir, throttleArg, ...apps] = process.argv.slice(2);
const THROTTLE = Number(throttleArg);
const SETTLE_MS = 5000;
const WINDOW_MS = 5000;
const keys = JSON.parse(
  fs.readFileSync(path.join(__dirname, "scene_keys.json"), "utf8"),
);
fs.mkdirSync(outdir, { recursive: true });

const taskSeconds = async (cdp) => {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return metrics.find((m) => m.name === "TaskDuration").value;
};

(async () => {
  const browser = await chromium.launch({ channel: "chromium" });
  for (const [scene, key] of Object.entries(keys)) {
    for (const app of apps) {
      const [name, base] = app.split(/=(.*)/s);
      const label = `${name}.${scene}`;
      const url = `${base}/${key}`;
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
        // Which build the page was served: its own scripts' URLs are hashed.
        const build = await page.evaluate(() =>
          [...document.scripts]
            .map((s) => s.src)
            .filter((src) => src.startsWith(location.origin))
            .join(" "),
        );
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
        const before = await taskSeconds(cdp);
        await page.waitForTimeout(WINDOW_MS);
        const after = await taskSeconds(cdp);
        const s = await page.evaluate(() => {
          const f = window.__f;
          const span = f.at(-1) - f[0];
          return {
            frames: f.length - 1,
            span,
            fps: (f.length - 1) / (span / 1000),
          };
        });
        if (THROTTLE > 1)
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        const taskMs = (after - before) * 1000;
        const row = {
          label,
          url,
          throttle: THROTTLE,
          time: new Date().toISOString(),
          build,
          ...s,
          taskPerFrame: taskMs / s.frames,
          errors: errors.slice(0, 3),
        };
        fs.appendFileSync(
          path.join(outdir, "results.jsonl"),
          `${JSON.stringify(row)}\n`,
        );
        await page.screenshot({ path: path.join(outdir, `${label}.png`) });
        console.log(
          `${label.padEnd(30)} fps ${s.fps.toFixed(1).padStart(5)}  main ${row.taskPerFrame.toFixed(1).padStart(6)} ms/frame${errors.length ? `  ERR ${errors[0]}` : ""}`,
        );
      } catch (e) {
        console.log(`${label} ERROR ${e.message.split("\n")[0]}`);
      }
      await context.close();
    }
  }
  await browser.close();
})();
