/**
 * The stroke's arrowheads: a cone per head, built in view space and sized as
 * MathBox's `arrow.position` shader sizes it.
 */
import {
  cross,
  length,
  max,
  normalize,
  positionGeometry,
  select,
  vec3,
} from "three/tsl";
import { projectWithDepthStyle } from "../shader/depthStyle";
import type { Template } from "../instances/Instances";
import { arrowLengthAt, strokeMaterial, strokeStyle, toView } from "./style";

const SIDES = 24;
/** A cone's length over its radius, as MathBox draws it. */
const LENGTH_TO_RADIUS = 2.5;

const ring = Array.from({ length: SIDES }, (_, i) => {
  const angle = (2 * Math.PI * i) / SIDES;
  return [Math.cos(angle), Math.sin(angle), 1];
});

/** Tip at the origin; a unit-radius base, closed, at z = 1. */
export const CONE_TEMPLATE: Template = {
  positions: [0, 0, 0, ...ring.flat(), 0, 0, 1],
  index: ring.flatMap((_, i) => {
    const a = 1 + i;
    const b = 1 + ((i + 1) % SIDES);
    return [0, a, b, b, a, SIDES + 1];
  }),
};

const build = () => {
  const tip = toView("arrowTip");
  const middle = toView("pathMiddle");
  const shaft = toView("arrowNeighbor").sub(tip);
  const shaftLength = length(shaft);
  // A basis around the shaft; the offset only keeps the cross product off zero.
  const along = shaft.div(max(shaftLength, 1e-12));
  const across = normalize(cross(along, along.yzx.add(vec3(0.1, 0.2, 0.3))));
  const up = cross(across, along);

  const coneLength = arrowLengthAt(tip, middle, toView("pathFar"));
  const radius = coneLength.div(LENGTH_TO_RADIUS);

  const position = tip
    .add(across.mul(radius).mul(positionGeometry.x))
    .add(up.mul(radius).mul(positionGeometry.y))
    .add(along.mul(coneLength).mul(positionGeometry.z));
  // No direction to point in: every vertex at the tip draws nothing.
  return {
    vertex: projectWithDepthStyle(
      select(shaftLength.greaterThan(0), position, tip),
      strokeStyle.zBias,
      strokeStyle.zIndex,
    ),
  };
};

/** The arrowhead material for a stroke of that transparency. */
export const arrowMaterial = strokeMaterial(build);
