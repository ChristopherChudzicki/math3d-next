import type { Coords, RGBA } from "@math3d/viewport-spec";
import { Instances, strideOf } from "../stroke/Instances";
import { isDrawable, put } from "../stroke/packPaths";
import { labelAtlas, onLabelRelayout } from "./atlas";
import type { LabelAtlas, LabelText, LabelWeight, Slot } from "./LabelAtlas";
import {
  LABEL_LAYOUT,
  LabelUniforms,
  QUAD_TEMPLATE,
  labelMaterial,
} from "./labelMaterial";

/**
 * math3d gives its MathBox labels a weight and an offset only, so the rest
 * default to MathBox's own.
 */
export type LabelStyle = {
  weight: LabelWeight;
  /** MathBox's `<Label offset>`, +y up the screen. */
  offset: readonly [number, number];
  /** MathBox's gray when absent. */
  color?: RGBA;
  zBias?: number;
  zIndex?: number;
};

const MATHBOX_LABEL_COLOR: RGBA = [0.5, 0.5, 0.5, 1];

/**
 * A MathBox label offset in CSS pixels to the text's center. MathBox scales
 * the offset by 16/24 with the text, and centers its sprite 4 atlas px above
 * the middle of the text's em box.
 */
export const fromMathBoxOffset = ([x, y]: readonly [number, number]): [
  number,
  number,
] => [(x * 2) / 3, (y * 2) / 3 - 8 / 3];

const STRIDE = strideOf(LABEL_LAYOUT);

/**
 * Text drawn at points, a fixed size on screen, depth-tested: MathBox's
 * `<Label>`. One mesh and one draw call for any number of labels; every
 * label's raster is in one shared atlas.
 */
export class Labels {
  private readonly instances = new Instances(
    QUAD_TEMPLATE,
    LABEL_LAYOUT,
    labelMaterial(),
  );

  private readonly uniforms = new LabelUniforms();

  private readonly unsubscribe = onLabelRelayout(() => this.fill());

  /** One per distinct string, each acquired once from the atlas. */
  private texts = new Map<string, LabelText>();

  private anchors: Coords[] = [];

  private anchorTexts: LabelText[] = [];

  /** Add it to the item's `Group`. */
  readonly mesh = this.instances.mesh;

  constructor(private readonly atlas: LabelAtlas = labelAtlas()) {
    this.mesh.userData.label = this.uniforms;
    // After the rest of its item; `syncGraphics` orders the items.
    this.mesh.renderOrder = 1;
  }

  /**
   * Draws `text` at each of `positions`: one string for all, or one per
   * position. Positions are in the coordinates of whatever holds `mesh`.
   */
  set(
    positions: readonly Coords[],
    text: string | null | readonly (string | null)[],
    style: LabelStyle,
  ): void {
    const textAt = (i: number) =>
      typeof text === "string" || text === null ? text : text[i];
    const texts = new Map<string, LabelText>();
    const anchors: Coords[] = [];
    const anchorTexts: LabelText[] = [];
    positions.forEach((position, i) => {
      const string = textAt(i);
      if (!string || !isDrawable(position)) return;
      let label = texts.get(string);
      if (!label) {
        label = { text: string, weight: style.weight };
        texts.set(string, label);
      }
      anchors.push(position);
      anchorTexts.push(label);
    });
    // Acquires before releasing, so a string kept is never redrawn.
    texts.forEach((label) => this.atlas.acquire(label));
    this.texts.forEach((label) => this.atlas.release(label));
    this.texts = texts;
    this.anchors = anchors;
    this.anchorTexts = anchorTexts;

    const { uniforms } = this;
    uniforms.color.set(...(style.color ?? MATHBOX_LABEL_COLOR));
    uniforms.offset.set(...fromMathBoxOffset(style.offset));
    uniforms.zBias = style.zBias ?? 0;
    uniforms.zIndex = style.zIndex ?? 0;
    this.fill();
  }

  dispose(): void {
    this.unsubscribe();
    this.texts.forEach((label) => this.atlas.release(label));
    this.texts.clear();
    this.instances.dispose();
  }

  private fill(): void {
    const { anchors, anchorTexts, atlas } = this;
    const slots = new Map<LabelText, Slot>();
    this.instances.fill(anchors.length, (out) => {
      anchors.forEach((anchor, i) => {
        const label = anchorTexts[i];
        let slot = slots.get(label);
        if (!slot) {
          slot = atlas.slot(label);
          slots.set(label, slot);
        }
        const offset = put(out, i * STRIDE, anchor);
        /* eslint-disable no-param-reassign */
        out[offset] = slot.x;
        out[offset + 1] = slot.y;
        out[offset + 2] = slot.width;
        out[offset + 3] = slot.height;
        /* eslint-enable no-param-reassign */
      });
      return anchors.length;
    });
  }
}
