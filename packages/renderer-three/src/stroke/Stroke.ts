import type { Coords } from "@math3d/viewport-spec";
import { Instances } from "../instances/Instances";
import { CONE_TEMPLATE, arrowMaterial } from "./arrowMaterial";
import { SEGMENT_TEMPLATE, lineMaterial } from "./lineMaterial";
import {
  ARROW_LAYOUT,
  SEGMENT_LAYOUT,
  countArrows,
  countSegments,
  packArrows,
  packSegments,
} from "./packPaths";
import { StrokeUniforms } from "./style";
import type { StrokeStyle } from "./style";

/**
 * Polylines drawn at a pixel width, with optional arrowheads at each path's
 * ends: MathBox's line. Paths are in the coordinates of whatever holds
 * `objects`; width, joins and arrowheads are sized in the shader, so no
 * scale on a parent distorts them.
 */
export class Stroke {
  private readonly uniforms = new StrokeUniforms();

  private readonly line = new Instances(
    SEGMENT_TEMPLATE,
    SEGMENT_LAYOUT,
    lineMaterial(false, false),
  );

  private readonly arrows = new Instances(
    CONE_TEMPLATE,
    ARROW_LAYOUT,
    arrowMaterial(false),
  );

  /** Add these to the item's `Group`. */
  readonly objects: readonly Instances["mesh"][] = [
    this.line.mesh,
    this.arrows.mesh,
  ];

  constructor() {
    this.objects.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.userData.stroke = this.uniforms;
    });
  }

  set(paths: Coords[][], style: StrokeStyle): void {
    const ends = { start: !!style.start, end: !!style.end };
    this.uniforms.set(style, ends);
    // A translucent stroke blends, in three's pass after every opaque one;
    // it still writes depth, as MathBox does.
    const transparent = style.color[3] < 1;
    this.line.mesh.material = lineMaterial(transparent, ends.start || ends.end);
    this.arrows.mesh.material = arrowMaterial(transparent);
    this.line.fill(countSegments(paths), (out) => packSegments(paths, out));
    this.arrows.fill(countArrows(paths, ends), (out) =>
      packArrows(paths, ends, out),
    );
  }

  dispose(): void {
    this.line.dispose();
    this.arrows.dispose();
  }
}
