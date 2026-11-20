import { describe, expect, test, vi } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
import type { PointSpec } from "@math3d/viewport-spec";
import { fakeSurface } from "../label/__tests__/fakeSurface";
import { LabelAtlas } from "../label/LabelAtlas";
import { buildPoint } from "./point";

vi.mock("../label/atlas", () => ({
  labelAtlas: () => new LabelAtlas(fakeSurface()),
}));

const pointSpec = (overrides: Partial<PointSpec> = {}): PointSpec => ({
  kind: "point",
  positions: [
    [0, 0, 0],
    [1, 2, 3],
  ],
  size: 8,
  color: [0.2, 0.4, 0.6, 1],
  label: "P",
  zBias: 0,
  zIndex: 0,
  ...overrides,
});

const partsOf = (graphic: ReturnType<typeof buildPoint>) => {
  const [fill, edge, labels] = graphic.object
    .children as Mesh<InstancedBufferGeometry>[];
  return { discs: [fill, edge], labels };
};

describe("buildPoint", () => {
  test("labels every point, after its discs", () => {
    const spec = pointSpec();
    const { discs, labels } = partsOf(buildPoint(spec, "oit"));
    expect(labels.geometry.instanceCount).toBe(spec.positions.length);
    discs.forEach((mesh) =>
      expect(labels.renderOrder).toBeGreaterThan(mesh.renderOrder),
    );
  });

  test("redraws in place for an updated spec", () => {
    const graphic = buildPoint(pointSpec(), "oit");
    const { discs, labels } = partsOf(graphic);
    graphic.update(pointSpec({ positions: [[0, 0, 0]], label: null }));
    partsOf(graphic).discs.forEach((mesh, i) => expect(mesh).toBe(discs[i]));
    expect(discs[0].geometry.instanceCount).toBe(1);
    expect(labels.visible).toBe(false);
  });
});
