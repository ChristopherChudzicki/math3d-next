import { CanvasTexture, LinearFilter } from "three/webgpu";
import type { AtlasSurface, LabelText, Slot } from "./LabelAtlas";

/** MathBox's label: 16 px `sans-serif` with a 2 px outline, in CSS pixels. */
const FONT_SIZE = 16;
const OUTLINE = 2;
const PADDING = OUTLINE + 1;
/** Room for accents above and descenders below. */
const HEIGHT = FONT_SIZE * 1.25 + 2 * PADDING;

/** A raster's device-pixel size, for text that many CSS pixels wide. */
export const rasterSize = (
  textWidth: number,
  pixelRatio: number,
): [number, number] => [
  Math.ceil((textWidth + 2 * PADDING) * pixelRatio),
  Math.ceil(HEIGHT * pixelRatio),
];

const fontOf = ({ weight }: LabelText) => `${weight} ${FONT_SIZE}px sans-serif`;

/**
 * Label rasters on a canvas, as coverage: green is the text with its outline,
 * red the text alone, on opaque black. The shader colors them, so one raster
 * serves every color.
 */
export class CanvasSurface implements AtlasSurface {
  private readonly measuring = document
    .createElement("canvas")
    .getContext("2d")!;

  private context: CanvasRenderingContext2D | null = null;

  private texture: CanvasTexture | null = null;

  /** @param onTexture Gets each new texture, and `null` once it is freed. */
  constructor(
    private readonly onTexture: (texture: CanvasTexture | null) => void,
  ) {}

  measure(label: LabelText, pixelRatio: number): [number, number] {
    this.measuring.font = fontOf(label);
    return rasterSize(this.measuring.measureText(label.text).width, pixelRatio);
  }

  reset(width: number, height: number): void {
    const { texture, context } = this;
    const current = context?.canvas;
    if (
      texture &&
      context &&
      current?.width === width &&
      current.height === height
    ) {
      context.fillStyle = "#000";
      context.fillRect(0, 0, width, height);
      texture.needsUpdate = true;
      return;
    }
    texture?.dispose();
    this.texture = null;
    this.context = null;
    if (width > 0 && height > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      this.context = canvas.getContext("2d")!;
      this.context.fillStyle = "#000";
      this.context.fillRect(0, 0, width, height);
      this.texture = new CanvasTexture(canvas);
      // Rows run top down in the shader, on both backends.
      this.texture.flipY = false;
      this.texture.generateMipmaps = false;
      this.texture.minFilter = LinearFilter;
    }
    this.onTexture(this.texture);
  }

  draw(label: LabelText, slot: Slot, pixelRatio: number): void {
    const { context, texture } = this;
    if (!context || !texture) throw new Error("The atlas has no surface.");
    const { x, y, width, height } = slot;
    context.save();
    context.beginPath();
    context.rect(x, y, width, height);
    context.clip();
    context.translate(x + width / 2, y + height / 2);
    context.scale(pixelRatio, pixelRatio);
    context.font = fontOf(label);
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.lineJoin = "round";
    context.lineWidth = 2 * OUTLINE;
    context.strokeStyle = "#0f0";
    context.fillStyle = "#0f0";
    context.strokeText(label.text, 0, 0);
    context.fillText(label.text, 0, 0);
    // Adds red without touching green.
    context.globalCompositeOperation = "lighter";
    context.fillStyle = "#f00";
    context.fillText(label.text, 0, 0);
    context.restore();
    texture.needsUpdate = true;
  }
}
