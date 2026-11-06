import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

test.use({ disable3d: false });

test("?renderer=usegpu without a WebGPU adapter draws MathBox and says so", async ({
  page,
  prepareScene,
}) => {
  // No adapter whatever the browser offers, so this branch always holds.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "gpu", {
      value: { requestAdapter: async () => null },
      configurable: true,
    });
  });
  const pageErrors: Error[] = [];
  page.on("pageerror", (error) => pageErrors.push(error));
  const responses: string[] = [];
  page.on("response", (response) => responses.push(response.url()));

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=usegpu`);

  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "mathbox");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(
    page.getByText(
      "This link asks for the experimental WebGPU renderer, which this browser doesn't support. Showing the scene with the default renderer.",
    ),
  ).toBeVisible();
  // A build keeps the module's name as the prefix of its hashed chunk.
  expect(responses.filter((url) => /GpuViewportContent/.test(url))).toEqual([]);
  expect(pageErrors).toEqual([]);
});
