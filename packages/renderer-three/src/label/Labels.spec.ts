import { describe, expect, test } from "vitest";
import type { Coords } from "@math3d/viewport-spec";
import { fakeSurface } from "./__tests__/fakeSurface";
import { LabelAtlas } from "./LabelAtlas";
import { Labels } from "./Labels";
import type { LabelStyle } from "./Labels";

const style: LabelStyle = { weight: "bold", offset: [0, 24] };

const setUp = () => {
  const atlas = new LabelAtlas(fakeSurface(), () => {});
  return { atlas, labels: new Labels(atlas) };
};

const drawn = (labels: Labels) => labels.mesh.geometry.instanceCount;

describe("Labels", () => {
  test("draws a label at each finite position that has text", () => {
    const { labels } = setUp();
    const positions: Coords[] = [
      [0, 0, 0],
      [1, 0, 0],
      [NaN, 0, 0],
      [2, 0, 0],
    ];
    labels.set(positions, ["a", "", "b", "c"], style);
    expect(drawn(labels)).toBe(2);
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
    const { color, offset, zBias, zIndex } = labels.mesh.userData.label;
    expect(offset.toArray()).toEqual(style.offset);
    expect(color.toArray()).toEqual([0.5, 0.5, 0.5, 1]);
    expect([zBias, zIndex]).toEqual([0, 0]);
  });

  test("gives the atlas back strings it no longer draws, and all of them on dispose", () => {
    const { atlas, labels } = setUp();
    const position: Coords[] = [[0, 0, 0]];
    labels.set(position, "old", style);
    labels.set(position, "new", style);
    expect(() => atlas.slot({ text: "old", weight: "bold" })).toThrow();
    labels.dispose();
    expect(atlas.size).toEqual([0, 0]);
  });
});
