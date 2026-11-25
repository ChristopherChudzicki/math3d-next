import { makeItem } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { sceneFingerprint } from "./fingerprint";

const camera = makeItem(MIT.Camera);
const slider = makeItem(MIT.VariableSlider);
const folder = makeItem(MIT.Folder);
const surface = makeItem(MIT.ExplicitSurface);
const items: MathItem[] = [camera, slider, folder, surface];
const itemOrder = {
  main: [folder.id],
  setup: [camera.id],
  [folder.id]: [slider.id, surface.id],
};
const base = { title: "Torus", items, itemOrder };

const withProperties = (item: MathItem, properties: object): MathItem[] =>
  items.map((it) =>
    it.id === item.id
      ? ({ ...it, properties: { ...it.properties, ...properties } } as MathItem)
      : it,
  );

describe("sceneFingerprint", () => {
  test.each([
    ["camera position", camera, { position: "[9,9,9]" }],
    ["camera target", camera, { target: "[1,1,1]" }],
    [
      "slider value",
      slider,
      { value: { ...slider.properties.value, rhs: "3" } },
    ],
    ["slider play state", slider, { isAnimating: "true" }],
    ["folder collapse", folder, { isCollapsed: "true" }],
  ])("ignores the %s", (_label, item, properties) => {
    expect(
      sceneFingerprint({ ...base, items: withProperties(item, properties) }),
    ).toBe(sceneFingerprint(base));
  });

  test.each([
    [
      "slider variable name",
      slider,
      { value: { ...slider.properties.value, lhs: "S" } },
    ],
    ["expression", surface, { expr: { ...surface.properties.expr, rhs: "x" } }],
    ["camera setting", camera, { isOrthographic: "true" }],
  ])("sees a change to the %s", (_label, item, properties) => {
    expect(
      sceneFingerprint({ ...base, items: withProperties(item, properties) }),
    ).not.toBe(sceneFingerprint(base));
  });

  test("sees a title change and a reordering of folder contents", () => {
    expect(sceneFingerprint({ ...base, title: "Sphere" })).not.toBe(
      sceneFingerprint(base),
    );
    expect(
      sceneFingerprint({
        ...base,
        itemOrder: { ...itemOrder, [folder.id]: [surface.id, slider.id] },
      }),
    ).not.toBe(sceneFingerprint(base));
  });

  test("ignores the order of the items array and of object keys", () => {
    const reordered = [...items].reverse().map(
      (it) =>
        ({
          ...it,
          properties: Object.fromEntries(
            Object.entries(it.properties).reverse(),
          ),
        }) as MathItem,
    );
    expect(sceneFingerprint({ ...base, items: reordered })).toBe(
      sceneFingerprint(base),
    );
  });
});
