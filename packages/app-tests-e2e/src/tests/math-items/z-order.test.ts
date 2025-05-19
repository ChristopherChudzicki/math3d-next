import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";
import { getItemForm, getLatex } from "@/utils/selectors";

const user = makeUserInfo();
test.use({ user });

test("Building a custom scene", async ({ page, prepareScene }) => {
  const scene = new SceneBuilder();
  scene
    .folder({ description: "F1" })
    .point({ description: "F1_point" })
    .line({ description: "F1_line" })
    .explicitSurface({ description: "F1_surfaceA" })
    .implicitSurface({ description: "F1_surfaceB", zOrder: "4" });
  scene
    .folder({ description: "F2" })
    .point({ description: "F2_point" })
    .line({ description: "F2_line" })
    .parametricSurface({ description: "F2_surfaceA", zOrder: "100" })
    .explicitSurfacePolar({ description: "F2_surfaceB" });
  const key = await prepareScene(scene);
  await page.goto(`/${key}`);

  /**
   * NOTE: Expected z-order order for this scene is:
   *
   * item      default z-order     overridden z-order
   * ==================================================
   * Grid ZX        0                0
   * Grid YZ        1                1
   * Grid XY        2                2
   * Axis Z         3                3
   * Axis Y         4                4
   * Axis X         5                5
   * F1_point       9                9
   * F1_line        8                8
   * F1_surfaceA    13               13
   * F1_surfaceB    12                4
   * F2_point       7                7
   * F2_line        6                6
   * F2_surfaceA    11             100
   * F2_surfaceB    10              10
   */

  await test.step("Check z-oder of F2_point (uses placeholder value)", async () => {
    const description = "F2_point";
    const item = getItemForm(page, { description });
    await item.getByRole("button", { name: "More Settings" }).click();

    const zOrder = page.getByLabel("Z-Order", { exact: true });
    expect(await zOrder.evaluate(getLatex)).toBe("");
    expect(zOrder).toHaveText("7");
    await page.keyboard.press("Escape");
  });

  await test.step("Check z-oder of F1_surfaceA (uses placeholder value)", async () => {
    const description = "F1_surfaceA";
    const item = getItemForm(page, { description });
    await item.getByRole("button", { name: "More Settings" }).click();

    const zOrder = page.getByLabel("Z-Order", { exact: true });
    expect(await zOrder.evaluate(getLatex)).toBe("");
    expect(await zOrder).toHaveText("13");
    await page.keyboard.press("Escape");
  });

  await test.step("Check z-oder of F2_surfaceA (uses set value)", async () => {
    const description = "F2_surfaceA";
    const item = getItemForm(page, { description });
    await item.getByRole("button", { name: "More Settings" }).click();

    const zOrder = page.getByLabel("Z-Order", { exact: true });
    expect(await zOrder.evaluate(getLatex)).toBe("100");
    expect(zOrder).toHaveText("100");
    await page.keyboard.press("Escape");
  });
});
