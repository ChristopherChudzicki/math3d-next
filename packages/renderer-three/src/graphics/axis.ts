import { Group } from "three/webgpu";
import type { AxisSpec, Coords } from "@math3d/viewport-spec";
import { Stroke } from "../stroke/Stroke";
import { Ticks } from "../stroke/Ticks";
import { headReach } from "../stroke/style";
import { Labels } from "../label/Labels";
import type { LabelStyle } from "../label/Labels";
import { formatTick } from "./formatTick";
import { pointOn } from "./coords";
import type { Transparency } from "../shader/material";
import type { Graphic } from "./builders";

const onAxis = (axis: AxisSpec["axis"], value: number): Coords =>
  pointOn([axis], [value]);

/** MathBox's tick direction: the axis crossed with +z, or +y for z itself. */
const TICK_DIRECTION: Record<AxisSpec["axis"], Coords> = {
  x: [0, -1, 0],
  y: [1, 0, 0],
  z: [0, 1, 0],
};

/** Where math3d's MathBox tick labels land: below the axis, or right of z. */
const tickLabelStyle = (axis: AxisSpec["axis"]): LabelStyle => ({
  weight: "normal",
  offset: axis === "z" ? [13, -3] : [0, -16],
});

const END_LABEL_STYLE: LabelStyle = { weight: "normal", offset: [0, 17] };

/** An axis line, its ticks and their labels, and its end label. */
export const buildAxis = (
  spec: AxisSpec,
  transparency: Transparency,
): Graphic<AxisSpec> => {
  const stroke = new Stroke(transparency);
  const ticks = new Ticks(transparency);
  const tickLabels = new Labels(transparency);
  const endLabel = new Labels(transparency);
  // MathBox's order, after the stroke.
  ticks.mesh.renderOrder = 1;
  tickLabels.mesh.renderOrder = 2;
  endLabel.mesh.renderOrder = 3;
  const set = (next: AxisSpec) => {
    const [min, max] = next.range;
    stroke.set([[onAxis(next.axis, min), onAxis(next.axis, max)]], next);
    const values = next.ticks.visible ? next.ticks.values : [];
    const positions = values.map((value) => onAxis(next.axis, value));
    // Ticks take the axis's opacity, zBias and zIndex, which math3d's
    // MathBox ticks don't.
    ticks.set(positions, TICK_DIRECTION[next.axis], next);
    // A tick or the end label can sit at an arrowhead's tip, which the cone
    // covers from behind: every label of an axis with one clears it.
    const anchorStyle = {
      zBias: next.zBias,
      zIndex: next.zIndex,
      clearance: next.start || next.end ? headReach(next) : 0,
    };
    tickLabels.set(positions, values.map(formatTick), {
      ...tickLabelStyle(next.axis),
      ...anchorStyle,
    });
    endLabel.set([onAxis(next.axis, max)], next.label, {
      ...END_LABEL_STYLE,
      ...anchorStyle,
    });
  };
  set(spec);
  return {
    object: new Group().add(
      ...stroke.objects,
      ticks.mesh,
      tickLabels.mesh,
      endLabel.mesh,
    ),
    update: set,
    dispose: () => {
      stroke.dispose();
      ticks.dispose();
      tickLabels.dispose();
      endLabel.dispose();
    },
  };
};
