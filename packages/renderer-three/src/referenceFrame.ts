/**
 * A box at the axes' range and an x/y/z line (red/green/blue) from the origin
 * to each axis's max, in three's one-pixel lines, so the camera can be checked
 * by hand. It stands in until a primitive draws, and the lines task
 * (tk-three-js-renderer-lines-vectors-parametric-curve-44974d) deletes it.
 */
import {
  Box3,
  Box3Helper,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
} from "three/webgpu";
import type { AxesRange } from "@math3d/viewport-spec";

const COLORS = [
  [1, 0, 0],
  [0, 0.7, 0],
  [0, 0, 1],
].flatMap((rgb) => [...rgb, ...rgb]);

/** In math coordinates, so it belongs under the world group. */
export class ReferenceFrame {
  readonly object = new Group();

  private readonly box = new Box3();

  private readonly boxLines = new Box3Helper(this.box, 0x808080);

  private readonly axes = new LineSegments(
    new BufferGeometry(),
    new LineBasicMaterial({ vertexColors: true }),
  );

  private readonly ends = new Float32BufferAttribute(new Array(18).fill(0), 3);

  constructor() {
    this.axes.geometry.setAttribute("position", this.ends);
    this.axes.geometry.setAttribute(
      "color",
      new Float32BufferAttribute(COLORS, 3),
    );
    this.object.add(this.boxLines, this.axes);
  }

  setRange(range: AxesRange): void {
    this.box.min.set(range[0][0], range[1][0], range[2][0]);
    this.box.max.set(range[0][1], range[1][1], range[2][1]);
    // Each axis's line runs from the origin (vertex 2i) to its max (2i + 1).
    range.forEach(([, max], i) => this.ends.setComponent(2 * i + 1, i, max));
    this.ends.needsUpdate = true;
    this.axes.geometry.computeBoundingSphere();
  }

  dispose(): void {
    this.boxLines.dispose();
    this.axes.geometry.dispose();
    this.axes.material.dispose();
  }
}
