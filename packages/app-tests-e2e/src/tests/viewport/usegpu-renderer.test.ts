import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

test.use({ disable3d: false });

// No Playwright-launched Chromium, on macOS or on CI, exposes a WebGPU adapter,
// so this takes the "unavailable" branch; a GPU-capable runner takes the other.
test("?renderer=usegpu renders a canvas, or says WebGPU is unavailable", async ({
  page,
  prepareScene,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  // navigator.gpu exists without an adapter, so both branches load the chunk and its
  // text .wasm; the dev server inlines the .wasm, so only a build fetches it. Matched
  // by content type: the SPA fallback answers a missing asset with 200 text/html.
  const chunk = page.waitForResponse(
    (r) =>
      /\/GpuViewportContent[-.]/.test(r.url()) &&
      /javascript/.test(r.headers()["content-type"] ?? ""),
  );
  const wasm = page
    .waitForResponse((r) => r.headers()["content-type"] === "application/wasm")
    .catch(() => null);
  await page.goto(`/${key}?renderer=usegpu`);
  if (!new URL((await chunk).url()).pathname.endsWith(".tsx")) {
    expect(await wasm).not.toBeNull();
  }

  // This package's TS lib has no WebGPU types.
  const hasGpu = await page.evaluate(() => {
    const { gpu } = navigator as {
      gpu?: { requestAdapter: () => Promise<unknown> };
    };
    return gpu?.requestAdapter().then((a) => !!a) ?? false;
  });
  const viewport = page.getByTestId("scene");
  if (hasGpu) {
    await expect(viewport.locator("canvas")).toBeVisible();
    // Set once the controls first render, so the adapter and device are up.
    await expect(viewport.locator("[data-ready]")).toBeAttached();
    await expect(
      viewport.getByRole("link", { name: "Use the default renderer" }),
    ).toHaveCount(0);
  } else {
    await expect(
      viewport.getByText("WebGPU is unavailable in this browser"),
    ).toBeVisible();
    await expect(
      viewport.getByRole("link", { name: "Use the default renderer" }),
    ).toHaveAttribute("href", `/${key}`);
  }
  expect(pageErrors).toEqual([]);
});
