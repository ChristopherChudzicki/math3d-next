import { expect, test } from "vitest";
import { makeItem } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { isRestorableDraft } from "./restorable";
import type { DraftRecord } from "./storage";

const folder = makeItem(MIT.Folder);
const point = makeItem(MIT.Point);
const camera = makeItem(MIT.Camera);

const draftOf = (
  items: unknown[],
  itemOrder: Record<string, string[]>,
): DraftRecord => ({
  id: "d",
  title: "",
  items: items as MathItem[],
  itemOrder,
  key: null,
  author: null,
  baseModifiedDate: null,
  createdAt: 0,
  updatedAt: 0,
});

const goodOrder = {
  main: [folder.id],
  setup: [camera.id],
  [folder.id]: [point.id],
};

test("accepts a well-formed draft", () => {
  expect(isRestorableDraft(draftOf([folder, point, camera], goodOrder))).toBe(
    true,
  );
});

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
  expect(isRestorableDraft(draftOf(items, goodOrder))).toBe(false);
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
  expect(isRestorableDraft(draftOf([folder, point, camera], itemOrder))).toBe(
    false,
  );
});
