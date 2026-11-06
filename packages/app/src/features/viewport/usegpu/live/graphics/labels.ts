import { use } from "@use-gpu/live";
import type { LiveElement } from "@use-gpu/live";
import { Label } from "@use-gpu/plot";
import { useRenderContext } from "@use-gpu/workbench";
import type { Coords } from "@/features/viewport/shared/coordinates";
import type { GraphicSpec } from "@/features/viewport/usegpu/graphicSpec/types";

/** A graphic's depth bias and draw order, shared by its labels. */
type Layering = Pick<GraphicSpec, "zBias" | "zIndex">;

/** Shared by every label. `family` must name a font in `scene.ts`'s `FONTS`; an unknown one falls back to Use.GPU's built-in font. */
export const LABEL_STYLE = {
  family: "Lato",
  size: 16,
  color: [0, 0, 0, 1],
  depth: 0,
};

/** MathBox's 40px above a point or line end. */
const ITEM_LABEL_OFFSET: [number, number] = [0, -40];

type LabelProps = Parameters<typeof Label>[0] & { offset: [number, number] };

/**
 * `Label` with `offset` in CSS pixels. Use.GPU's label shader adds `offset` in
 * device pixels but scales glyphs by the pixel ratio.
 */
export const CssPixelLabel = (props: LabelProps): LiveElement => {
  const { pixelRatio } = useRenderContext();
  const [x, y] = props.offset;
  return use(Label, { ...props, offset: [x * pixelRatio, y * pixelRatio] });
};

/**
 * Screen-space text centered at each position plus `offsetPx`. Use.GPU's
 * label frame has +y down the screen (MathBox's is up).
 */
export const renderLabels = (
  positions: Coords[],
  text: string,
  offsetPx: [number, number],
  { zBias, zIndex }: Layering,
): LiveElement =>
  use(CssPixelLabel, {
    positions,
    labels: positions.map(() => text),
    placement: "center",
    offset: offsetPx,
    zBias,
    zIndex,
    ...LABEL_STYLE,
  });

/** `drawn`, plus `label` at `positions` when there is one. */
export const withItemLabel = (
  drawn: LiveElement,
  positions: Coords[],
  label: string | null,
  layering: Layering,
): LiveElement =>
  label === null
    ? drawn
    : [drawn, renderLabels(positions, label, ITEM_LABEL_OFFSET, layering)];
