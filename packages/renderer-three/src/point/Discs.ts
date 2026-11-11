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
 * Like MathBox, it draws every disc's fill, then every disc's rim, so a rim's
 * depth write never hides a farther disc's fill.
 */
export class Discs {
  private readonly uniforms = new DiscUniforms();

  private readonly instances = new Instances(SQUARE_TEMPLATE, DISC_LAYOUT, [
    discMaterial("fill"),
    discMaterial("edge"),
  ]);

  /** Add these to the item's `Group`, keeping their `renderOrder`s 0 and 1. */
  readonly objects = this.instances.meshes;

  constructor() {
    const [, edge] = this.objects;
    edge.renderOrder = 1;
    this.objects.forEach((mesh) => {
      // eslint-disable-next-line no-param-reassign
      mesh.userData.disc = this.uniforms;
    });
  }

  set(points: readonly Coords[], style: DiscStyle): void {
    this.uniforms.set(style);
    this.instances.mesh.material = discMaterial("fill", style.color[3] < 1);
    // MathBox draws nothing at size 0; the rim's padding alone would.
    const drawn = style.diameter > 0 ? points : [];
    this.instances.fill(drawn.length, (out) => {
      let count = 0;
      drawn.forEach((point) => {
        if (isDrawable(point)) {
          put(out, 3 * count, point);
          count += 1;
        }
      });
      return count;
    });
  }

  dispose(): void {
    this.instances.dispose();
  }
}
