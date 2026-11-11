import type { Coords } from "@math3d/viewport-spec";
import { Instances, strideOf } from "../instances/Instances";
import { isDrawable, put } from "../instances/points";
import { SEGMENT_TEMPLATE } from "./lineMaterial";
import { TICK_LAYOUT, tickMaterial } from "./tickMaterial";
import { StrokeUniforms } from "./style";
import type { StrokeStyle } from "./style";

export type TickStyle = Pick<
  StrokeStyle,
  "width" | "color" | "zBias" | "zIndex"
>;

const STRIDE = strideOf(TICK_LAYOUT);

const NO_HEADS = { start: false, end: false };

/**
 * Tick marks a fixed pixel length, drawn as a stroke's line is: MathBox's
 * `<Ticks>`. Positions and direction are in the coordinates of whatever
 * holds `mesh`.
 */
export class Ticks {
  private readonly uniforms = new StrokeUniforms();

  private readonly instances = new Instances(
    SEGMENT_TEMPLATE,
    TICK_LAYOUT,
    tickMaterial(false),
  );

  /** Add it to the item's `Group`. */
  readonly mesh = this.instances.mesh;

  constructor() {
    this.mesh.userData.stroke = this.uniforms;
  }

  /** A tick at each of `positions`, each running along `direction`. */
  set(positions: readonly Coords[], direction: Coords, style: TickStyle): void {
    this.uniforms.set(style, NO_HEADS);
    this.mesh.material = tickMaterial(style.color[3] < 1);
    this.instances.fill(positions.length, (out) => {
      let offset = 0;
      positions.forEach((position) => {
        if (!isDrawable(position)) return;
        offset = put(out, offset, position);
        offset = put(out, offset, direction);
      });
      return offset / STRIDE;
    });
  }

  dispose(): void {
    this.instances.dispose();
  }
}
