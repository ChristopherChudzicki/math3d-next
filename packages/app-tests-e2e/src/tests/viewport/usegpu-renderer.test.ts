import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

test.use({ disable3d: false });

// Playwright's Chromium on macOS exposes no WebGPU adapter, so locally this
// takes the "unavailable" branch; a GPU-capable runner takes the canvas one.
test("?renderer=usegpu renders a canvas, or says WebGPU is unavailable", async ({
  page,
  prepareScene,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=usegpu`);

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
    // The canvas mounts before the adapter and device resolve, which can still fail.
    await page.waitForTimeout(1500);
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
