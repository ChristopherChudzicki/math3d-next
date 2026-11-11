import { Mesh } from "three/webgpu";
import type { Coords } from "@math3d/viewport-spec";
import { Instances } from "../instances/Instances";
import { isDrawable, put } from "../instances/points";
import {
  DISC_LAYOUT,
  DiscUniforms,
  SQUARE_TEMPLATE,
  discMaterial,
} from "./discMaterial";
import type { DiscStyle } from "./discMaterial";

/**
 * Antialiased discs at points, a pixel size at view depth 1: MathBox's
 * `<Point>`. Points are in the coordinates of whatever holds `objects`.
 *
 * Like MathBox, it draws every disc's opaque fill, then every disc's rim, so
 * a rim's depth write never hides a farther disc's fill.
 */
export class Discs {
  private readonly uniforms = new DiscUniforms();

  private readonly fill = new Instances(
    SQUARE_TEMPLATE,
    DISC_LAYOUT,
    discMaterial("fill", false),
  );

  /** Draws the fill's instances, from its geometry. */
  private readonly edge = new Mesh(
    this.fill.mesh.geometry,
    discMaterial("edge", false),
  );

  /** Add these to the item's `Group`, keeping their `renderOrder`s 0 and 1. */
  readonly objects: readonly Mesh[] = [this.fill.mesh, this.edge];

  constructor() {
    this.edge.renderOrder = 1;
    this.edge.frustumCulled = false;
    this.edge.visible = false;
    this.objects.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.userData.disc = this.uniforms;
    });
  }

  set(points: readonly Coords[], style: DiscStyle): void {
    this.uniforms.set(style);
    this.fill.mesh.material = discMaterial("fill", style.color[3] < 1);
    this.fill.fill(points.length, (out) => {
      let count = 0;
      points.forEach((point) => {
        if (isDrawable(point)) {
          put(out, 3 * count, point);
          count += 1;
        }
      });
      return count;
    });
    // The fill replaces its geometry when it outgrows it.
    this.edge.geometry = this.fill.mesh.geometry;
    this.edge.visible = this.fill.mesh.visible;
  }

  dispose(): void {
    this.fill.dispose();
    // Releases what the renderer keeps per mesh; the material is shared.
    this.edge.dispose();
  }
}
