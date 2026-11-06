import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { colorfulPixelRatio } from "@/utils/colorfulPixelRatio";

test.use({
  disable3d: false,
  // SwiftShader gives headless Chromium a WebGPU adapter, on macOS and on Linux CI.
  launchOptions: {
    args: [
      "--enable-unsafe-webgpu",
      "--enable-features=Vulkan",
      "--use-vulkan=swiftshader",
      "--use-webgpu-adapter=swiftshader",
      "--use-angle=swiftshader",
    ],
  },
});

test("?renderer=usegpu draws with the Use.GPU viewport", async ({
  page,
  prepareScene,
}) => {
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  // Use.GPU reports WGSL and validation errors through console.error. Failed
  // requests log there too; only `/me` may fail (signed out, it answers 403).
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const expected403 =
      message.text().startsWith("Failed to load resource") &&
      /\/me\/?$/.test(new URL(message.location().url).pathname);
    if (!expected403) consoleErrors.push(message.text());
  });

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  // No controls sidebar, matching `frame-render.test.ts`, where 0.1 is calibrated.
  await page.goto(`/${key}?renderer=usegpu&controls=0`);

  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "usegpu");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport.locator("[data-ready]")).toBeAttached({
    timeout: 15_000,
  });
  // `data-ready` marks a device, not a frame: wait for the colored surface.
  // An empty scene (axes and grid only) reads 0; see `frame-render.test.ts`.
  await expect
    .poll(
      async () =>
        colorfulPixelRatio(
          page,
          (await viewport.screenshot()).toString("base64"),
        ),
      { timeout: 15_000 },
    )
    .toBeGreaterThan(0.1);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
