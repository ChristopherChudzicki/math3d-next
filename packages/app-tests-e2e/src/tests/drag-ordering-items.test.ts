import { Locator, Page, expect } from "@playwright/test";
import { test } from "@/fixtures/users";
import { SceneBuilder, makeUserInfo } from "@math3d/mock-api";

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const drag = async (
  page: Page,
  source: Locator,
  target: Locator,
  {
    sourceOffset = { x: 100, y: 5 },
    targetOffset = { x: 25, y: 25 },
    steps = 25,
    downTimeout = 150,
  } = {},
) => {
  const h1 = await source.elementHandle();
  const h2 = await target.elementHandle();
  const bbox1 = await h1?.boundingBox();
  const bbox2 = await h2?.boundingBox();
  if (!bbox1 || !bbox2) {
    throw new Error("Should not be null");
  }
  const sourcePos = {
    x: bbox1.x + sourceOffset.x,
    y: bbox1.y + sourceOffset.y,
  };
  const targetPos = {
    x: bbox2.x + targetOffset.x,
    y: bbox2.y + targetOffset.y,
  };
  await page.mouse.move(sourcePos.x, sourcePos.y);
  await page.mouse.down();
  await sleep(downTimeout);
  await page.mouse.move(targetPos.x, targetPos.y, { steps });
  await page.mouse.move(targetPos.x, targetPos.y, { steps });
  await page.mouse.up();
};

const getItem = (
  page: Page,
  folderDescription: string,
  itemDescription?: string,
) => {
  const folder = page.locator("css=[aria-roledescription='sortable']", {
    hasText: folderDescription,
  });
  if (!itemDescription) return folder;
  return folder.locator("css=[aria-roledescription='sortable']", {
    hasText: itemDescription,
  });
};

const getAllItemDescriptions = async (page: Page, count = 9) => {
  const locator = page.locator(
    "css=[aria-roledescription='sortable'] [aria-label='Description']",
  );
  await expect(locator).toHaveCount(count);
  return locator.evaluateAll((list) => list.map((el) => el.innerHTML));
};

const initialOrder = [
  "F1",
  "P1a",
  "P1b",
  "F2",
  "P2a",
  "P2b",
  "F3",
  "P3a",
  "P3b",
];

const makeFolderScene = () => {
  const scene = new SceneBuilder();
  const f1 = scene.folder({ description: "F1" });
  f1.point({ description: "P1a" });
  f1.point({ description: "P1b" });
  const f2 = scene.folder({ description: "F2" });
  f2.point({ description: "P2a" });
  f2.point({ description: "P2b" });
  const f3 = scene.folder({ description: "F3" });
  f3.point({ description: "P3a" });
  f3.point({ description: "P3b" });
  return scene.json();
};

const user = makeUserInfo();
test.use({ user });

test("Dragging item X after item Y", async ({ page, prepareScene }) => {
  const key = await prepareScene(makeFolderScene());
  await page.goto(`/${key}`);
  const source = getItem(page, "F2", "P2a");
  const target = getItem(page, "F3", "P3b");

  await expect(await getAllItemDescriptions(page)).toEqual(initialOrder);
  await drag(page, source, target);
  const after = await getAllItemDescriptions(page);
  expect(after).toEqual("F1 P1a P1b F2 P2b F3 P3a P3b P2a".split(" "));
});

test("Dragging item X before item Y", async ({ page, prepareScene }) => {
  const key = await prepareScene(makeFolderScene());
  await page.goto(`/${key}`);
  const source = getItem(page, "F3", "P3b");
  const target = getItem(page, "F2", "P2b");

  await expect(await getAllItemDescriptions(page)).toEqual(initialOrder);
  await drag(page, source, target);
  const after = await getAllItemDescriptions(page);
  expect(after).toEqual("F1 P1a P1b F2 P2a P3b P2b F3 P3a".split(" "));
});

test("Dragging folder X after folder Y", async ({ page, prepareScene }) => {
  const key = await prepareScene(makeFolderScene());
  await page.goto(`/${key}`);
  const source = getItem(page, "F2");
  const target = getItem(page, "F3");

  await expect(await getAllItemDescriptions(page)).toEqual(initialOrder);
  await drag(page, source, target);
  const after = await getAllItemDescriptions(page);
  expect(after).toEqual("F1 P1a P1b F3 P3a P3b F2 P2a P2b".split(" "));
});

test("Dragging folder X before folder Y", async ({ page, prepareScene }) => {
  const key = await prepareScene(makeFolderScene());
  await page.goto(`/${key}`);
  const source = getItem(page, "F3");
  const target = getItem(page, "F2");

  await expect(await getAllItemDescriptions(page)).toEqual(initialOrder);
  await drag(page, source, target, { targetOffset: { x: 5, y: -40 } });
  const after = await getAllItemDescriptions(page);
  expect(after).toEqual("F1 P1a P1b F3 P3a P3b F2 P2a P2b".split(" "));
});
