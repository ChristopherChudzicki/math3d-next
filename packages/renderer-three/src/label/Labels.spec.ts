import { describe, expect, test } from "vitest";
import { Layers, NormalBlending } from "three/webgpu";
import type { Coords } from "@math3d/viewport-spec";
import { fakeSurface } from "./__tests__/fakeSurface";
import { LabelAtlas } from "./LabelAtlas";
import { Labels } from "./Labels";
import type { LabelStyle } from "./Labels";
import { OVERLAY_LAYER } from "../shader/sceneDepth";

const style: LabelStyle = { weight: "bold", offset: [0, 24] };

const setUp = () => {
  const atlas = new LabelAtlas(fakeSurface());
  return { atlas, labels: new Labels("oit", atlas) };
};

const drawn = (labels: Labels) => labels.mesh.geometry.instanceCount;

const onLayer = (labels: Labels, layer: number) => {
  const layers = new Layers();
  layers.set(layer);
  return labels.mesh.layers.test(layers);
};

/** Each drawn label's slot width, as the shader reads it. */
const slotWidths = (labels: Labels) => {
  const slot = labels.mesh.geometry.getAttribute("labelSlot");
  return Array.from({ length: drawn(labels) }, (_, i) => slot.getZ(i));
};

describe("Labels", () => {
  test("draws each finite position's own text, skipping empty ones", () => {
    const { labels } = setUp();
    const positions: Coords[] = [
      [0, 0, 0],
      [1, 0, 0],
      [NaN, 0, 0],
      [2, 0, 0],
    ];
    labels.set(positions, ["a", "", "bb", "ccc"], style);
    expect(slotWidths(labels)).toEqual([10, 30]);
  });

  test("draws one string at every position", () => {
    const { labels } = setUp();
    labels.set(
      [
        [0, 0, 0],
        [1, 0, 0],
      ],
      "P",
      style,
    );
    expect(drawn(labels)).toBe(2);
  });

  test("gives its mesh the style as given, with MathBox's defaults for the rest", () => {
    const { labels } = setUp();
    labels.set([[0, 0, 0]], "a", style);
    const { color, offset, zBias, zIndex, clearance } =
      labels.mesh.userData.label;
    expect(offset.toArray()).toEqual(style.offset);
    expect(color.toArray()).toEqual([0.5, 0.5, 0.5, 1]);
    expect([zBias, zIndex, clearance]).toEqual([0, 0, 0]);
  });

  test("gives its mesh the depth style and reach of the mark at the anchor", () => {
    const { labels } = setUp();
    const mark = { zBias: 2, zIndex: 1, clearance: 16 };
    labels.set([[0, 0, 0]], "a", { ...style, ...mark });
    expect(labels.mesh.userData.label).toMatchObject(mark);
  });

  test("under the oit model, draws over the scene with no depth test", () => {
    const { labels } = setUp();
    labels.set([[0, 0, 0]], "P", style);
    expect(onLayer(labels, OVERLAY_LAYER)).toBe(true);
    expect(onLayer(labels, 0)).toBe(false);
    expect(labels.mesh.material).toMatchObject({
      depthTest: false,
      depthWrite: false,
    });
  });

  test("gives the atlas back strings it no longer draws, and all of them on dispose", () => {
    const { atlas, labels } = setUp();
    const position: Coords[] = [[0, 0, 0]];
    labels.set([position[0], position[0]], "old", style);
    labels.set(position, "new", style);
    expect(() => atlas.slot({ text: "old", weight: "bold" })).toThrow();
    labels.dispose();
    expect(atlas.size).toEqual([0, 0]);
  });

  test("re-reads its slots when the atlas lays out again", () => {
    const { atlas, labels } = setUp();
    labels.set([[0, 0, 0]], "a", style);
    atlas.setPixelRatio(2);
    // 10 CSS px at the new ratio.
    expect(slotWidths(labels)).toEqual([20]);
  });

  test("under the ordered model, draws in the scene, depth-tested, blending as three does", () => {
    const labels = new Labels("ordered", new LabelAtlas(fakeSurface()));
    labels.set([[0, 0, 0]], "P", style);
    expect(onLayer(labels, 0)).toBe(true);
    expect(labels.mesh.material).toMatchObject({
      transparent: true,
      blending: NormalBlending,
      depthTest: true,
      depthWrite: true,
    });
  });
});
