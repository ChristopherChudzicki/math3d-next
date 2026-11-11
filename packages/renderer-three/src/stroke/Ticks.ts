import type { Coords } from "@math3d/viewport-spec";
import { Instances, strideOf } from "../instances/Instances";
import { isDrawable, put } from "../instances/points";
import { alphaOf } from "../shader/material";
import type { Transparency } from "../shader/material";
import { SEGMENT_TEMPLATE } from "./lineMaterial";
import { TICK_LAYOUT, TICK_WIDTH, tickMaterial } from "./tickMaterial";
import { StrokeUniforms } from "./style";
import type { StrokeStyle } from "./style";

export type TickStyle = Pick<StrokeStyle, "color" | "zBias" | "zIndex">;

const STRIDE = strideOf(TICK_LAYOUT);

const NO_HEADS = { start: false, end: false };

/**
 * Tick marks at MathBox's pixel size, drawn as a stroke's line is: MathBox's
 * `<Ticks>`. Positions and direction are in the coordinates of whatever
 * holds `mesh`.
 */
export class Ticks {
  private readonly uniforms = new StrokeUniforms();

  private readonly instances: Instances;

  /** Add it to the item's `Group`. */
  readonly mesh: Instances["mesh"];

  constructor(private readonly transparency: Transparency) {
    this.instances = new Instances(
      SEGMENT_TEMPLATE,
      TICK_LAYOUT,
      tickMaterial("opaque", transparency),
    );
    this.mesh = this.instances.mesh;
    this.mesh.userData.stroke = this.uniforms;
  }

  /** A tick at each of `positions`, each running along `direction`. */
  set(positions: readonly Coords[], direction: Coords, style: TickStyle): void {
    this.uniforms.set({ ...style, width: TICK_WIDTH }, NO_HEADS);
    this.mesh.material = tickMaterial(
      alphaOf(style.color[3]),
      this.transparency,
    );
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
