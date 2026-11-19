import { describe, expect, test, vi } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
import type { LineSpec } from "@math3d/viewport-spec";
import { fakeSurface } from "../label/__tests__/fakeSurface";
import { LabelAtlas } from "../label/LabelAtlas";
import { headReach } from "../stroke/style";
import { buildLine } from "./line";

vi.mock("../label/atlas", () => ({
  labelAtlas: () => new LabelAtlas(fakeSurface()),
}));

const lineSpec = (overrides: Partial<LineSpec> = {}): LineSpec => ({
  kind: "line",
  paths: [
    [
      [0, 0, 0],
      [1, 2, 3],
    ],
  ],
  width: 4,
  color: [0.2, 0.4, 0.6, 1],
  start: false,
  end: true,
  arrowSize: 6,
  label: "v",
  zBias: 2,
  zIndex: 1,
  ...overrides,
});

const labelsOf = (graphic: ReturnType<typeof buildLine>) =>
  graphic.object.children.at(-1) as Mesh<InstancedBufferGeometry>;

describe("buildLine", () => {
  test("labels the last point, with the line's depth style and room for its arrowhead", () => {
    const spec = lineSpec();
    const labels = labelsOf(buildLine(spec, "oit"));
    const anchor = labels.geometry.getAttribute("labelAnchor");
    expect([anchor.getX(0), anchor.getY(0), anchor.getZ(0)]).toEqual([1, 2, 3]);
    expect(labels.userData.label).toMatchObject({
      zBias: spec.zBias,
      zIndex: spec.zIndex,
      clearance: headReach(spec),
    });
  });

  test("gives its label no clearance without an arrowhead at the end", () => {
    const labels = labelsOf(buildLine(lineSpec({ end: false }), "oit"));
    expect(labels.userData.label.clearance).toBe(0);
  });
});
