import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import { coloredShare, expectThreeViewport } from "@/utils/threeViewport";

test.use({
  disable3d: false,
  // SwiftShader gives headless Chromium a WebGPU adapter, on macOS and on
  // Linux CI; without one three.js falls back to WebGL2, which
  // `threejs-renderer.test.ts` covers.
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

test("three.js draws lines on the WebGPU backend", async ({
  page,
  prepareScene,
}) => {
  // three.js reports WGSL and validation errors through console.error.
  const errors = collectPageErrors(page);
  const warnings: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "warning") warnings.push(message.text());
  });
  const scene = new SceneBuilder();
  scene.folder().vector({ width: "20" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=threejs&controls=0`);

  await expectThreeViewport(page);
  expect(await coloredShare(page)).toBeGreaterThan(0.002);
  const hasAdapter = await page.evaluate(async () => {
    const { gpu } = navigator as Navigator & {
      gpu?: { requestAdapter(): Promise<unknown> };
    };
    return (await gpu?.requestAdapter()) != null;
  });
  expect(hasAdapter).toBe(true);
  // three.js warns "running under WebGL2 backend" when it falls back.
  expect(warnings.filter((text) => text.includes("WebGL2"))).toEqual([]);
  expect(errors).toEqual([]);
});
