import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

test.use({ disable3d: false });

test("?renderer=usegpu without a WebGPU adapter draws MathBox and says so", async ({
  page,
  prepareScene,
}) => {
  // Hides any real adapter, so the fallback path runs on every machine.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", {
      value: { requestAdapter: async () => null },
      configurable: true,
    });
  });
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=usegpu`);

  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "mathbox");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(
    page.getByText(
      "This link asks for the experimental WebGPU renderer, which isn't available in this browser. Showing the scene with the default renderer.",
    ),
  ).toBeVisible();
  // A build keeps the module's name as the prefix of its hashed chunk.
  expect(requests.filter((url) => /GpuViewportContent/.test(url))).toEqual([]);
  expect(pageErrors).toEqual([]);
});
