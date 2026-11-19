import type { Page } from "@playwright/test";
import type { MathfieldElement } from "mathlive";
import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import { SceneBuilder } from "@math3d/mock-api";
import AppPage from "@/utils/pages/AppPage";
import { getByFieldLabel, getLatex } from "@/utils/selectors";

test("Typing arrays into an empty <math-field />", async ({
  page,
  prepareScene,
}) => {
  const scene = new SceneBuilder();
  scene.folder().point({
    description: "SomePoint",
    coords: "",
  });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({ description: "SomePoint" });
  const mf = item.field("Coordinates");
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
  const scene = new SceneBuilder();
  scene.folder().point({ description: "SomePoint", coords: "" });
  const key = await prepareScene(scene.json());
  await page.goto(`/${key}`);
  const app = new AppPage(page);

  const item = await app.getUniqueItemSettings({ description: "SomePoint" });
  const mf = item.field("Coordinates");
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
      const scene = new SceneBuilder();
      scene.folder().point({ description: "SomePoint", coords: "" });
      const key = await prepareScene(scene.json());
      await page.goto(`/${key}`);
      const app = new AppPage(page);

      const item = await app.getUniqueItemSettings({
        description: "SomePoint",
      });
      const mf = item.field("Coordinates");
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
