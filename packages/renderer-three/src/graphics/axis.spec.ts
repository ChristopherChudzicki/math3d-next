import { describe, expect, test, vi } from "vitest";
import type { InstancedBufferGeometry, Mesh } from "three/webgpu";
import type { AxisSpec } from "@math3d/viewport-spec";
import { LabelAtlas } from "../label/LabelAtlas";
import { fakeSurface } from "../label/__tests__/fakeSurface";
import { buildAxis } from "./axis";

vi.mock("../label/atlas", () => {
  const atlas = new LabelAtlas(fakeSurface());
  return { labelAtlas: () => atlas };
});

const axisSpec = (overrides: Partial<AxisSpec> = {}): AxisSpec => ({
  kind: "axis",
  axis: "y",
  width: 1,
  color: [0.5, 0.5, 0.5, 0.4],
  zBias: 2,
  zIndex: 1,
  start: false,
  end: true,
  arrowSize: 6,
  range: [-2, 3],
  ticks: { divisions: 5, visible: true, values: [-2, -1, 1, 2, 3] },
  label: "y",
  ...overrides,
});

const partsOf = (graphic: ReturnType<typeof buildAxis>) => {
  const [line, arrows, ticks, tickLabels, endLabel] = graphic.object
    .children as Mesh<InstancedBufferGeometry>[];
  return { line, arrows, ticks, tickLabels, endLabel };
};

const firstPoint = (mesh: Mesh<InstancedBufferGeometry>, name: string) => {
  const attribute = mesh.geometry.getAttribute(name);
  return [attribute.getX(0), attribute.getY(0), attribute.getZ(0)];
};

describe("buildAxis", () => {
  test("strokes the axis across its range, with its arrowheads", () => {
    const { line, arrows } = partsOf(buildAxis(axisSpec()));
    expect(firstPoint(line, "segmentA")).toEqual([0, -2, 0]);
    expect(firstPoint(line, "segmentB")).toEqual([0, 3, 0]);
    expect(arrows.geometry.instanceCount).toBe(1);
  });

  test("draws a tick and a label at each tick value, ticks in the axis's style", () => {
    const spec = axisSpec();
    const { ticks, tickLabels } = partsOf(buildAxis(spec));
    expect(ticks.geometry.instanceCount).toBe(spec.ticks.values.length);
    expect(tickLabels.geometry.instanceCount).toBe(spec.ticks.values.length);
    expect(firstPoint(ticks, "tickCenter")).toEqual([0, -2, 0]);
    expect(firstPoint(ticks, "tickDirection")).toEqual([1, 0, 0]);
    const { color, zBias, zIndex } = ticks.userData.stroke;
    expect(color.toArray()).toEqual(spec.color);
    expect({ zBias, zIndex }).toEqual({
      zBias: spec.zBias,
      zIndex: spec.zIndex,
    });
  });

  test("draws no ticks or tick labels when ticks are hidden", () => {
    const spec = axisSpec();
    const graphic = buildAxis(spec);
    graphic.update(axisSpec({ ticks: { ...spec.ticks, visible: false } }));
    const { ticks, tickLabels } = partsOf(graphic);
    expect(ticks.visible).toBe(false);
    expect(tickLabels.visible).toBe(false);
  });

  test("labels the axis's high end", () => {
    const { endLabel } = partsOf(buildAxis(axisSpec()));
    expect(endLabel.geometry.instanceCount).toBe(1);
    expect(firstPoint(endLabel, "labelAnchor")).toEqual([0, 3, 0]);
  });

  test("orders its parts as MathBox draws them: stroke, ticks, tick labels, end label", () => {
    const { line, arrows, ticks, tickLabels, endLabel } = partsOf(
      buildAxis(axisSpec()),
    );
    expect(line.renderOrder).toBe(arrows.renderOrder);
    expect(arrows.renderOrder).toBeLessThan(ticks.renderOrder);
    expect(ticks.renderOrder).toBeLessThan(tickLabels.renderOrder);
    expect(tickLabels.renderOrder).toBeLessThan(endLabel.renderOrder);
  });
});
