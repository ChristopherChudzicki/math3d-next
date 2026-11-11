/**
 * The stroke's line: one quad per segment, widened in screen space with
 * miter joins, after MathBox's `line.position` shader.
 */
import type { Node } from "three/webgpu";
import {
  cameraNear,
  cameraProjectionMatrix,
  dot,
  float,
  length,
  max,
  min,
  mix,
  positionGeometry,
  select,
  sqrt,
  vec2,
  vec3,
  vec4,
} from "three/tsl";
import { projectWithDepthStyle } from "../shader/depthStyle";
import type { Template } from "../instances/Instances";
import { arrowLengthAt, strokeMaterial, strokeStyle, toView } from "./style";

/** x is the corner's end of the segment (0 or 1), y its side of the line (±1). */
export const SEGMENT_TEMPLATE: Template = {
  positions: [0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0],
  index: [0, 1, 2, 2, 1, 3],
};

const viewDepth = (view: Node<"vec3">) => view.z.negate();

/**
 * Moves `point` along the segment onto the near plane when only it is nearer
 * than that, like MathBox's `fixCenter`, so no perspective divide sees w <= 0.
 */
const clipToNear = (point: Node<"vec3">, toward: Node<"vec3">) => {
  const from = viewDepth(point);
  const to = viewDepth(toward);
  const crosses = from.lessThan(cameraNear).and(to.greaterThan(cameraNear));
  return select(
    crosses,
    mix(point, toward, cameraNear.sub(from).div(to.sub(from))),
    point,
  );
};

/** How the projection scales view x and y. */
const projectionScale = cameraProjectionMatrix.mul(vec4(1, 1, 0, 0)).xy;

const project = (view: Node<"vec3">) =>
  cameraProjectionMatrix.mul(vec4(view, 1));

/** Screen position in units of half the viewport's height, on both axes. */
const toScreen = (clip: Node<"vec4">) => {
  const aspect = projectionScale.y.div(projectionScale.x);
  // Only a segment wholly behind the camera still has w <= 0 here, and its
  // vertices are clipped whatever this returns.
  return clip.xy.div(max(clip.w, 1e-6)).mul(vec2(aspect, 1));
};

const perpendicular = (v: Node<"vec2">) => vec2(v.y, v.x.negate());

// Squared screen length below which two points count as one.
const COINCIDENT = 1e-12;

/**
 * A segment's ends and the path's points beyond each, in view space. A
 * point beyond that equals its end means the path ends there.
 */
export type ViewSegment = {
  before: Node<"vec3">;
  a: Node<"vec3">;
  b: Node<"vec3">;
  after: Node<"vec3">;
};

/** The segment `packSegments` wrote. */
const packedSegment = (): ViewSegment => ({
  before: toView("segmentBefore"),
  a: toView("segmentA"),
  b: toView("segmentB"),
  after: toView("segmentAfter"),
});

/** A stroke line's vertex stage, and with `heads` its mask, for `segment`. */
export const lineVertex = (
  heads: boolean,
  segment: ViewSegment = packedSegment(),
) => {
  const atB = positionGeometry.x.greaterThan(0.5);
  const side = positionGeometry.y;
  const { before, a, b, after } = segment;
  // This corner's point, the segment's other end, and the path's next point
  // beyond this corner (the corner's own point where there is none).
  const corner = select(atB, b, a);
  const farEnd = select(atB, a, b);
  const beyond = select(atB, after, before);

  const center = clipToNear(corner, farEnd).toVar();
  const cut = viewDepth(corner).lessThan(cameraNear);
  const other = clipToNear(farEnd, corner);
  // A corner cut off at the near plane ends square, without a join.
  const neighbor = select(cut, center, clipToNear(beyond, corner));

  // MathBox's left, center and right, in path order.
  const clipCenter = project(center);
  const screenCenter = toScreen(clipCenter);
  const screenLeft = toScreen(project(select(atB, other, neighbor)));
  const screenRight = toScreen(project(select(atB, neighbor, other)));
  const toLeft = screenLeft.sub(screenCenter);
  const toRight = screenCenter.sub(screenRight);
  const left2 = dot(toLeft, toLeft);
  const right2 = dot(toRight, toRight);
  const hasLeft = left2.greaterThan(COINCIDENT);
  const hasRight = right2.greaterThan(COINCIDENT);
  const ownLeft = perpendicular(toLeft.div(sqrt(max(left2, COINCIDENT))));
  const ownRight = perpendicular(toRight.div(sqrt(max(right2, COINCIDENT))));
  // A path's end has one leg, whose normal stands in for the missing one's:
  // the miter below is then that leg's square end.
  const normalLeft = select<"vec2">(hasLeft, ownLeft, ownRight);
  const normalRight = select<"vec2">(hasRight, ownRight, ownLeft);

  // Miter along the mean normal, lengthened to keep each leg's width: at most
  // 10×, and no farther along a leg than MathBox's cap, the shorter leg's
  // length over its clip w.
  const sum = normalLeft.add(normalRight);
  const sumLength = length(sum);
  const miterNormal = select(
    sumLength.greaterThan(1e-4),
    sum.div(max(sumLength, 1e-4)),
    // The path doubles back: each segment ends square on its own normal.
    select(atB, normalLeft, normalRight),
  );
  const acrossLeg = max(dot(normalLeft, miterNormal).abs(), 0.1);
  const alongLeg = dot(perpendicular(normalLeft), miterNormal);
  const run = alongLeg.div(acrossLeg);
  const halfWidthAtUnitW = strokeStyle.halfWidth.mul(projectionScale.y);
  const shorterLeg2 = min(left2, right2).div(
    max(halfWidthAtUnitW.mul(halfWidthAtUnitW), 1e-20),
  );
  const miter = miterNormal.mul(
    sqrt(float(1).add(min(shorterLeg2, run.mul(run)))),
  );

  const join = select<"vec2">(hasLeft.or(hasRight), miter, vec2(0, 0));
  const position = center
    .add(vec3(join.mul(side).mul(strokeStyle.halfWidth), 0))
    .toVar();

  const vertex = projectWithDepthStyle(
    position,
    strokeStyle.zBias,
    strokeStyle.zIndex,
  );
  if (!heads) return { vertex };

  // How far each fragment is from the arrowheads' bases, as a multiple of
  // the arrowhead's length: negative inside one. MathBox's `clipEnds`.
  const pathStart = toView("pathStart");
  const pathMiddle = toView("pathMiddle");
  const pathEnd = toView("pathEnd");
  const arrowLength = arrowLengthAt(pathEnd, pathMiddle, pathStart);
  const outsideHead = (tip: Node<"vec3">, hasHead: Node<"float">) => {
    const toTip = tip.sub(center);
    const distance = length(toTip);
    const along = dot(tip.sub(position), toTip.div(max(distance, 1e-12)));
    // Exact `== 0`, as in MathBox: a non-finite tip gives a NaN distance,
    // which clips nothing.
    return select(
      hasHead.greaterThan(0.5),
      select(distance.equal(0), -1, along.div(max(arrowLength, 1e-12)).sub(1)),
      1,
    );
  };
  const outsideHeads = vec2(
    outsideHead(pathEnd, strokeStyle.hasEnd),
    outsideHead(pathStart, strokeStyle.hasStart),
  ).toVarying();

  return {
    vertex,
    mask: outsideHeads.x.lessThan(0).or(outsideHeads.y.lessThan(0)).not(),
  };
};

const plain = strokeMaterial(() => lineVertex(false));
const clippedUnderHeads = strokeMaterial(() => lineVertex(true));

/**
 * The line material for a stroke of that transparency. Only one with
 * arrowheads (`heads`) carries the `discard` that clips the line under them.
 */
export const lineMaterial = (transparent: boolean, heads: boolean) =>
  (heads ? clippedUnderHeads : plain)(transparent);
