import type { Coords, RGBA } from "@math3d/viewport-spec";
import { Instances, strideOf } from "../stroke/Instances";
import { labelAtlas, onLabelRelayout } from "./atlas";
import type { LabelAtlas, LabelText, LabelWeight } from "./LabelAtlas";
import {
  LABEL_LAYOUT,
  LabelUniforms,
  QUAD_TEMPLATE,
  labelMaterial,
} from "./labelMaterial";

export type LabelStyle = {
  weight: LabelWeight;
  color: RGBA;
  /** From the anchor to the text's center, in CSS pixels, +y up the screen. */
  offset: readonly [number, number];
  zBias: number;
  zIndex: number;
};

/** The gray MathBox draws labels in: its default style color. */
export const MATHBOX_LABEL_COLOR: RGBA = [0.5, 0.5, 0.5, 1];

/**
 * MathBox's `<Label offset>` as a `LabelStyle` offset. MathBox scales the
 * offset with the text, which it draws at 16 px from a 24 px atlas, and
 * centers its sprite 4 atlas pixels above the text's em box.
 */
export const fromMathBoxOffset = ([x, y]: readonly [number, number]): [
  number,
  number,
] => [(x * 2) / 3, (y * 2) / 3 - 8 / 3];

const STRIDE = strideOf(LABEL_LAYOUT);

const isDrawable = (point: Coords) => point.every(Number.isFinite);

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

  private readonly atlas: LabelAtlas = labelAtlas();

  private readonly unsubscribe = onLabelRelayout(() => this.fill());

  /** One per distinct string, each acquired once from the atlas. */
  private texts = new Map<string, LabelText>();

  private anchors: Coords[] = [];

  /** Each anchor's string. */
  private anchorTexts: LabelText[] = [];

  /** Add it to the item's `Group`. */
  readonly mesh = this.instances.mesh;

  constructor() {
    this.mesh.userData.label = this.uniforms;
  }

  /**
   * Draws `text` at each of `positions`: one string for all, or one per
   * position. Positions are in the coordinates of whatever holds `mesh`.
   */
  set(
    positions: readonly Coords[],
    text: string | readonly string[],
    style: LabelStyle,
  ): void {
    const textAt = (i: number) => (typeof text === "string" ? text : text[i]);
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
    uniforms.color.set(...style.color);
    uniforms.offset.set(...style.offset);
    uniforms.zBias = style.zBias;
    uniforms.zIndex = style.zIndex;
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
    this.instances.fill(anchors.length, (out) => {
      anchors.forEach((anchor, i) => {
        const { x, y, width, height } = atlas.slot(anchorTexts[i]);
        out.set([...anchor, x, y, width, height], i * STRIDE);
      });
      return anchors.length;
    });
  }
}
