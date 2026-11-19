import type { Page } from "@playwright/test";
import type { MathfieldElement } from "mathlive";
import { test, type Fixtures } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { getByFieldLabel, getLatex } from "@/utils/selectors";

/** An empty Point's Coordinates field, focused. */
const focusEmptyCoords = async (
  page: Page,
  prepareScene: Fixtures["prepareScene"],
) => {
  const scene = new SceneBuilder();
  scene.folder().point({ description: "SomePoint", coords: "" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({ description: "SomePoint" });
  const mf = item.field("Coordinates");
  await mf.click();
  await expect(mf).toBeFocused();
  return mf;
};

test("Typing arrays into an empty <math-field />", async ({
  page,
  prepareScene,
}) => {
  const mf = await focusEmptyCoords(page, prepareScene);
  await mf.type("[1,2,3,]");
  await expect(mf).toHaveJSProperty(
    "value",
    String.raw`\left\lbrack1,2,3,\right\rbrack`,
  );
});

test("Typing an inline shortcut inserts its LaTeX", async ({
  page,
  prepareScene,
}) => {
  const mf = await focusEmptyCoords(page, prepareScene);
  // An app shortcut, not one of MathLive's defaults.
  await mf.pressSequentially("rescale");
  await expect
    .poll(() => mf.evaluate(getLatex))
    .toBe(String.raw`\operatorname{rescale}`);
});

test.describe("Typing a function name inserts the bare function", () => {
  const cases = [
    ["sin(x)", String.raw`\sin\left(x\right)`],
    ["cos(x)+sin(x)", String.raw`\cos\left(x\right)+\sin\left(x\right)`],
    ["sinh", String.raw`\sinh`],
    ["arcsinh", String.raw`\operatorname{arcsinh}`],
    ["abs(x)", String.raw`\operatorname{\mathrm{abs}}\left(x\right)`],
    ["sin 2x", String.raw`\sin2x`],
  ];
  cases.forEach(([typed, expected]) => {
    test(typed, async ({ page, prepareScene }) => {
      const mf = await focusEmptyCoords(page, prepareScene);
      await mf.pressSequentially(typed);
      await expect.poll(() => mf.evaluate(getLatex)).toBe(expected);
    });
  });
});

/** The default scene's surface's color map field, caret at its start. */
const focusDefaultColorMap = async (page: Page) => {
  await page.goto(`/`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({
    description: "Explicit Surface",
  });
  // A long press opens the color dialog.
  await item.root.getByRole("button", { name: "Show Graphic" }).click({
    delay: 700,
  });
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("tab", { name: "Color Map" }).click();
  const mf = getByFieldLabel(dialog, "Color Expression", { exact: true });
  await mf.click();
  await mf.evaluate((e) =>
    (e as MathfieldElement).executeCommand("moveToMathfieldStart"),
  );
  return mf;
};

test("Editing the default color map keeps its parentheses", async ({
  page,
}) => {
  const mf = await focusDefaultColorMap(page);
  await page.keyboard.press("End");
  // MathLive re-serializes only on an edit; before one, value echoes the stored LaTeX.
  await mf.pressSequentially("+0");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");

  await expect
    .poll(() => mf.evaluate(getLatex))
    .toBe(
      String.raw`\operatorname{mod}(\operatorname{\mathrm{rescale}}_{z}\left(z\right),1)`,
    );
});

test("Typing ')' closes a '(' typed before existing content", async ({
  page,
}) => {
  const mf = await focusDefaultColorMap(page);
  // Slow enough for React to render between keys, as it does for a person typing.
  await mf.pressSequentially("(z)", { delay: 100 });
  await expect
    .poll(() => mf.evaluate(getLatex))
    .toBe(
      String.raw`\left(z\right)\operatorname{mod}(\operatorname{\mathrm{rescale}}_{z}\left(z\right),1)`,
    );
});

const activeElement = (page: Page) =>
  page.evaluate(() => document.activeElement?.tagName);

test("Toggling keyboard visibility auto-focuses a math-field and shows virtual keyboard when focused", async ({
  page,
}) => {
  await page.goto(`/`);
  await expect(activeElement(page)).resolves.toBe("BODY");
  const toggler = page.getByRole("button", { name: "Enable math keyboard" });
  await expect(toggler).toHaveAttribute("aria-pressed", "false");
  /**
   * Turn "auto-expand" ON
   */
  await toggler.click();

  // Arrow points "down" now
  await expect(toggler).toHaveAttribute("aria-pressed", "true");
  // Toggling the keyboard should auto-focus a mathfield
  await expect(activeElement(page)).resolves.toBe("MATH-FIELD");
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // Clicking away should hide the virtual keyboard
  await page.getByTestId("scene").click();
  await expect(page.locator(".ML__keyboard")).toBeHidden();

  // Clicking on the math-field should show the virtual keyboard
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toBeVisible();

  // We add a CSS transition to the backdrop, so double check that it actually exists
  await expect(page.locator(".ML__keyboard > .MLK__backdrop")).toBeVisible();

  /**
   * Turn "auto-expand" OFF
   */
  await toggler.click();
  // Arrow points "up" now.
  await expect(toggler).toHaveAttribute("aria-pressed", "false");
  await expect(page.locator(".ML__keyboard")).toBeHidden();
  await page.locator("math-field").first().click();
  await expect(page.locator(".ML__keyboard")).toBeHidden();
});

test("Escape leaves a math field in math mode and focused", async ({
  page,
  prepareScene,
}) => {
  const mf = await focusEmptyCoords(page, prepareScene);
  await mf.pressSequentially("x");
  await page.keyboard.press("Escape");
  await mf.pressSequentially("y");

  await expect(mf).toHaveJSProperty("value", "xy");
  await expect(mf).toHaveJSProperty("mode", "math");
  await expect(mf).toBeFocused();
});

test("Escape in a settings popover's math field closes the popover", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder().point({}, "the_point");
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
  const app = new AppPage(page);
  const item = await app.getUniqueItemSettings({ id: "the_point" });
  const moreSettings = item.moreSettings();
  await moreSettings.opener().click();
  const zBias = getByFieldLabel(moreSettings.root, "Z-Bias", { exact: true });
  await zBias.click();
  await expect(zBias).toBeFocused();

  await page.keyboard.press("Escape");

  await expect(moreSettings.root).toBeHidden();
});

/** The virtual keyboard's visible layer: "123" unless `switchTo` names another. */
const showVirtualKeyboard = async (page: Page, switchTo?: "f(x)") => {
  await page.getByRole("button", { name: "Enable math keyboard" }).click();
  const keyboard = page.locator(".ML__keyboard");
  await expect(keyboard).toBeVisible();
  if (switchTo) {
    await keyboard
      .locator(".layer-switch:visible", { hasText: switchTo })
      .first()
      .click();
  }
  return keyboard.locator(".MLK__layer.is-visible");
};

test("The virtual keyboard's ĵ and k̂ keys insert their unit vectors", async ({
  page,
  prepareScene,
}) => {
  const mf = await focusEmptyCoords(page, prepareScene);
  const layer = await showVirtualKeyboard(page);
  const key = (label: string) => layer.getByLabel(label, { exact: true });
  const shift = layer.locator(".shift");

  await key(String.raw`\unitj`).click();
  await key(String.raw`\unitk`).click();
  await shift.click();
  await key(String.raw`\unitj`).click();
  await shift.click();
  await key(String.raw`\unitk`).click();

  await expect(mf).toHaveJSProperty(
    "value",
    String.raw`\unitj\unitk\unity\unitz`,
  );
});

test("The virtual keyboard's inverse hyperbolic keys insert their functions", async ({
  page,
  prepareScene,
}) => {
  const mf = await focusEmptyCoords(page, prepareScene);
  const layer = await showVirtualKeyboard(page, "f(x)");
  // Each key gets an empty field: MathLive wraps adjacent operator names in \mathrm.
  const expectKeyInserts = async (fn: string) => {
    const latex = String.raw`\operatorname{${fn}}`;
    await mf.evaluate((e) =>
      (e as MathfieldElement).executeCommand("deleteAll"),
    );
    await layer.getByLabel(latex, { exact: true }).click();
    await expect(mf).toHaveJSProperty("value", latex);
  };

  await expectKeyInserts("arcsinh");
  await expectKeyInserts("arccosh");
  await expectKeyInserts("arctanh");
});
