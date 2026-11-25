import { expect, test } from "vitest";
import { makeItem } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { isRestorable } from "./restorable";

const folder = makeItem(MIT.Folder);
const point = makeItem(MIT.Point);
const camera = makeItem(MIT.Camera);

const contentOf = (items: unknown[], itemOrder: Record<string, string[]>) => ({
  items: items as MathItem[],
  itemOrder,
});

const goodOrder = {
  main: [folder.id],
  setup: [camera.id],
  [folder.id]: [point.id],
};

test("accepts a well-formed draft", () => {
  expect(isRestorable(contentOf([folder, point, camera], goodOrder))).toBe(
    true,
  );
});

// A limit, not a goal: a draft isn't migrated when item configs change, so a
// draft written before a property was added or removed is lost.
test.each([
  ["an unknown item type", [folder, { ...point, type: "Nope" }, camera]],
  [
    "a property the item config no longer has",
    [
      folder,
      { ...point, properties: { ...point.properties, gone: "1" } },
      camera,
    ],
  ],
  [
    "a property the item config added",
    [
      folder,
      {
        ...point,
        properties: Object.fromEntries(
          Object.entries(point.properties).slice(1),
        ),
      },
      camera,
    ],
  ],
])("rejects %s", (_label, items) => {
  expect(isRestorable(contentOf(items, goodOrder))).toBe(false);
});

test.each([
  ["no main folder", { setup: [camera.id] }],
  ["no setup folder", { main: [] }],
  [
    "an ordered id with no item",
    { ...goodOrder, main: [folder.id, "missing"] },
  ],
  ["an order key that isn't a folder", { ...goodOrder, [point.id]: [] }],
])("rejects an order with %s", (_label, itemOrder) => {
  expect(isRestorable(contentOf([folder, point, camera], itemOrder))).toBe(
    false,
  );
});

test("accepts an order key left behind by a deleted folder", () => {
  const itemOrder = { ...goodOrder, "deleted-folder": [] };
  expect(isRestorable(contentOf([folder, point, camera], itemOrder))).toBe(
    true,
  );
});
