import { expect } from "@playwright/test";
import invariant from "tiny-invariant";
import { SceneBuilder } from "@math3d/mock-api";
import { test } from "@/fixtures/users";
import { collectPageErrors } from "@/utils/collectPageErrors";
import UserMenu from "@/utils/pages/UserMenu";
import { getItemForm, getLatex } from "@/utils/selectors";
import { coloredShare, expectThreeViewport } from "@/utils/threeViewport";

test.use({ disable3d: false });

test("?renderer=threejs draws with the three.js viewport", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}?renderer=threejs`);

  await expectThreeViewport(page);
  await expect(
    page.getByRole("button", { name: "three.js renderer" }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("choosing three.js in the menu draws with it", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}`);
  await expect(page.getByTestId("scene")).toHaveAttribute(
    "data-renderer",
    "mathbox",
  );

  const menu = new UserMenu(page);
  await menu.opener().click();
  await menu.renderer("three.js (experimental)").click();

  await expectThreeViewport(page);
  await menu.opener().click();
  await expect(menu.renderer("three.js (experimental)")).toBeChecked();
  expect(errors).toEqual([]);
});

test("a drag in the three.js viewport writes the camera back", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  const key = await prepareScene(new SceneBuilder().json());
  await page.goto(`/${key}?renderer=threejs`);
  await expectThreeViewport(page);
  await page.getByRole("tab", { name: "Setup" }).click();
  const position = getItemForm(page, { id: "camera" }).getByLabel("Position");
  await expect.poll(() => position.evaluate(getLatex)).not.toBe("");
  const before = await position.evaluate(getLatex);

  const canvas = page.getByTestId("scene").locator("canvas");
  const box = await canvas.boundingBox();
  invariant(box);
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 100, y + 40, { steps: 10 });
  await page.mouse.up();

  await expect.poll(() => position.evaluate(getLatex)).not.toBe(before);
  expect(errors).toEqual([]);
});

test("a line keeps its pixel width when an axis is rescaled", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  // The camera and the line sit on x = 0, so rescaling x moves nothing: the
  // drawing changes only if the line's width, which runs along x on screen,
  // is scaled with the axis.
  const shareAt = async (xScale: string) => {
    const scene = new SceneBuilder()
      .camera({ position: "[0, -6, 2]" })
      .axis("x", { scale: xScale });
    scene.folder().line({ coords: "[[0, 0, -3], [0, 0, 3]]", width: "20" });
    const key = await prepareScene(scene.json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);
    await expectThreeViewport(page);
    return coloredShare(page);
  };

  const full = await shareAt("1");
  const squashed = await shareAt("1/4");

  expect(full).toBeGreaterThan(0.002);
  expect(Math.abs(squashed / full - 1)).toBeLessThan(0.05);
  expect(errors).toEqual([]);
});

test("an axis's ticks keep their pixel length when the axis they run along is rescaled", async ({
  page,
  prepareScene,
}) => {
  const errors = collectPageErrors(page);
  // z's ticks run along y. The camera and the z axis sit on y = 0, so
  // rescaling y changes the drawing only if it stretches the ticks.
  const shareAt = async (yScale: string, ticksVisible: string) => {
    const scene = new SceneBuilder()
      .camera({ position: "[-3, 0, 0]" })
      .axis("y", { scale: yScale })
      .axis("z", {
        color: "#ff0000",
        width: "1/4",
        divisions: "40",
        ticksVisible,
        labelVisible: "false",
      });
    const key = await prepareScene(scene.json());
    await page.goto(`/${key}?renderer=threejs&controls=0`);
    await expectThreeViewport(page);
    return coloredShare(page);
  };

  const line = await shareAt("1", "false");
  const ticks = (await shareAt("1", "true")) - line;
  const squashedTicks = (await shareAt("1/4", "true")) - line;

  expect(ticks).toBeGreaterThan(0.0002);
  expect(Math.abs(squashedTicks / ticks - 1)).toBeLessThan(0.1);
  expect(errors).toEqual([]);
});
