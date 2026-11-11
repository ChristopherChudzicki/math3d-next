import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { CoverageTable } from "@/features/viewport/shared/coverage";

const Z_BIAS =
  "approximate: matches MathBox in perspective; in orthographic, MathBox's dolly lets any zBias win outright and this renderer doesn't";

/** Where translucent items blend in MathBox's draw order. */
const ORDERED = "with ?oit=0";

const Z_ORDER = `approximate: by default, translucent items blend order-independently, so zOrder only says which of two coinciding opaque marks or labels is on top; ${ORDERED}, items draw in zOrder with depth writes, as in MathBox`;

const Z_INDEX_BLEND = `by default, two overlapping translucent items blend by depth whatever their zIndex; MathBox blends the higher over the lower, as this renderer does ${ORDERED}`;

const Z_INDEX = `approximate: draws over lower ones as in MathBox, but ${Z_INDEX_BLEND}`;

const GRID_OPACITY = `approximate: by default, a translucent surface tints the gridlines behind it, its own far ones too, where MathBox hides them; ${ORDERED}, they are hidden as in MathBox`;

const TICKS_FOLLOW_AXIS =
  "ticks take the axis's opacity, zBias and zIndex; math3d's MathBox draws them opaque at zBias and zIndex 0";

const SHADED =
  "approximate: glossy, as Use.GPU lights it; with ?gloss=0, matte, as MathBox lights it";

/** The properties every line-like item shares. */
const STROKE = {
  color: "drawn",
  description: "n/a: editor only",
  opacity: "drawn",
  visible: "drawn",
  calculatedVisibility: "drawn",
  useCalculatedVisibility: "drawn",
  size: "drawn",
  width: "drawn",
  zBias: Z_BIAS,
  zIndex: Z_INDEX,
  zOrder: Z_ORDER,
  start: "drawn",
  end: "drawn",
} as const;

/** The properties parametric, explicit and polar surfaces share. */
const SURFACE = {
  expr: "drawn",
  colorExpr: "drawn",
  color: "drawn",
  domain: "drawn",
  description: "n/a: editor only",
  gridOpacity: GRID_OPACITY,
  grid1: "drawn",
  grid2: "drawn",
  gridWidth: "drawn",
  opacity: "drawn",
  shaded: SHADED,
  samples1: "drawn",
  samples2: "drawn",
  visible: "drawn",
  calculatedVisibility: "drawn",
  useCalculatedVisibility: "drawn",
  zBias: `${Z_BIAS}; gridlines sit at the surface's zBias + 5, MathBox's at a fixed 5, so there a surface with zBias above 5 hides its own gridlines`,
  zIndex: `approximate: gridlines share the surface's zIndex; MathBox's stay at 0, so there a surface with zIndex 1 or more hides its own gridlines. Also, ${Z_INDEX_BLEND}`,
  zOrder: Z_ORDER,
} as const;

/** What the three.js renderer does with each stored property. */
export const coverage = {
  [MIT.Axis]: {
    ...STROKE,
    opacity: `approximate: ${TICKS_FOLLOW_AXIS}`,
    zBias: `${Z_BIAS}; ${TICKS_FOLLOW_AXIS}`,
    zIndex: `approximate: ${TICKS_FOLLOW_AXIS}. Also, ${Z_INDEX_BLEND}`,
    axis: "drawn",
    label: "drawn",
    labelVisible: "drawn",
    min: "drawn",
    max: "drawn",
    scale: "drawn",
    ticksVisible: "drawn",
    divisions: "drawn",
  },
  [MIT.Grid]: {
    axes: "drawn",
    description: "n/a: editor only",
    divisions: "drawn",
    color: "drawn",
    opacity: "drawn",
    snap: "drawn",
    visible: "drawn",
    calculatedVisibility: "drawn",
    useCalculatedVisibility: "drawn",
    width: "drawn",
    zBias: Z_BIAS,
    zIndex: Z_INDEX,
    zOrder: Z_ORDER,
  },
  [MIT.Point]: {
    color: "drawn",
    coords: "drawn",
    description: "n/a: editor only",
    label: "drawn",
    labelVisible: "drawn",
    opacity: "drawn",
    size: "drawn",
    zBias: Z_BIAS,
    zIndex: Z_INDEX,
    zOrder: Z_ORDER,
    visible: "drawn",
    calculatedVisibility: "drawn",
    useCalculatedVisibility: "drawn",
  },
  [MIT.Line]: {
    ...STROKE,
    coords: "drawn",
    label: "drawn",
    labelVisible: "drawn",
  },
  [MIT.Vector]: {
    ...STROKE,
    components: "drawn",
    tail: "drawn",
    label: "drawn",
    labelVisible: "drawn",
  },
  [MIT.VectorField]: {
    ...STROKE,
    domain: "drawn",
    samples1: "drawn",
    samples2: "drawn",
    samples3: "drawn",
    scale: "drawn",
    expr: "drawn",
  },
  [MIT.ParametricCurve]: {
    ...STROKE,
    expr: "drawn",
    domain: "drawn",
    samples1: "drawn",
  },
  [MIT.ParametricSurface]: SURFACE,
  [MIT.ExplicitSurface]: SURFACE,
  [MIT.ExplicitSurfacePolar]: SURFACE,
  [MIT.ImplicitSurface]: {
    color: "drawn",
    description: "n/a: editor only",
    opacity: `approximate: by default, a translucent closed surface shows its far side through its near side; MathBox does when lhs − rhs is negative outside it, and ${ORDERED}, this renderer does when it is positive`,
    visible: "drawn",
    calculatedVisibility: "drawn",
    useCalculatedVisibility: "drawn",
    samples:
      "approximate: cells per axis as in MathBox, capped at 128; MathBox has no cap but draws nothing above 5400 triangles",
    shaded: `${SHADED}. Lit with smooth normals from the sampled grid's gradient, as Use.GPU does; MathBox lights each triangle flat`,
    domain: "drawn",
    lhs: "drawn",
    rhs: "drawn",
    zBias: Z_BIAS,
    zIndex: Z_INDEX,
    zOrder: Z_ORDER,
  },
  [MIT.Camera]: {
    description: "n/a: editor only",
    isOrthographic: "drawn",
    isPanEnabled: "drawn",
    isZoomEnabled: "drawn",
    isRotateEnabled: "drawn",
    updateOnDrag: "drawn",
    position: "drawn",
    target: "drawn",
    useRelative: "drawn",
  },
} satisfies CoverageTable;
