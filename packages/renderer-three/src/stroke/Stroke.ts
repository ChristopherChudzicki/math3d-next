import type { Coords } from "@math3d/viewport-spec";
import { Instances } from "../instances/Instances";
import { alphaOf } from "../shader/material";
import type { Transparency } from "../shader/material";
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

  private readonly line: Instances;

  private readonly arrows: Instances;

  /** Add these to the item's `Group`. */
  readonly objects: readonly Instances["mesh"][];

  constructor(private readonly transparency: Transparency) {
    this.line = new Instances(
      SEGMENT_TEMPLATE,
      SEGMENT_LAYOUT,
      lineMaterial("opaque", false, transparency),
    );
    this.arrows = new Instances(
      CONE_TEMPLATE,
      ARROW_LAYOUT,
      arrowMaterial("opaque", transparency),
    );
    this.objects = [this.line.mesh, this.arrows.mesh];
    this.objects.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.userData.stroke = this.uniforms;
    });
  }

  set(paths: Coords[][], style: StrokeStyle): void {
    const ends = { start: !!style.start, end: !!style.end };
    this.uniforms.set(style, ends);
    const alpha = alphaOf(style.color[3]);
    const { transparency } = this;
    this.line.mesh.material = lineMaterial(
      alpha,
      ends.start || ends.end,
      transparency,
    );
    this.arrows.mesh.material = arrowMaterial(alpha, transparency);
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
