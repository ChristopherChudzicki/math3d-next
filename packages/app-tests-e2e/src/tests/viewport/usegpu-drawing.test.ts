import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";

test.use({
  disable3d: false,
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
  const responses: string[] = [];
  page.on("response", (response) => responses.push(response.url()));

  const scene = new SceneBuilder();
  scene.folder({ description: "Surface" }).explicitSurface();
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}?renderer=usegpu`);

  const viewport = page.getByTestId("scene");
  await expect(viewport).toHaveAttribute("data-renderer", "usegpu");
  await expect(viewport.locator("canvas")).toBeVisible();
  await expect(viewport.locator("[data-ready]")).toBeAttached();
  // A build keeps the module's name as the prefix of its hashed chunk.
  expect(responses.some((url) => /GpuViewportContent/.test(url))).toBe(true);
});
