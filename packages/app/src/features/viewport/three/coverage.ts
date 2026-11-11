import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { CoverageTable } from "@/features/viewport/shared/coverage";

const Z_BIAS =
  "approximate: matches MathBox in perspective; in orthographic, MathBox's dolly lets any zBias win outright and this renderer doesn't";

const GRID_OPACITY =
  "approximate: at gridOpacity 1 gridlines draw in three's opaque pass, so they show through a translucent surface in front; MathBox hides them behind their own surface";

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
  zIndex: "drawn",
  // Left `todo` for the transparency task, which decides draw order.
  zOrder: "todo",
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
  shaded: "drawn",
  samples1: "drawn",
  samples2: "drawn",
  visible: "drawn",
  calculatedVisibility: "drawn",
  useCalculatedVisibility: "drawn",
  zBias: `${Z_BIAS}; gridlines sit at the surface's zBias + 5, MathBox's at a fixed 5, so there a surface with zBias above 5 hides its own gridlines`,
  zIndex:
    "approximate: gridlines share the surface's zIndex; MathBox's stay at 0, so there a surface with zIndex 1 or more hides its own gridlines",
  // Left `todo` for the transparency task, which decides draw order.
  zOrder: "todo",
} as const;

/** What the three.js renderer does with each stored property. */
export const coverage = {
  [MIT.Axis]: {
    axis: "todo",
    color: "todo",
    description: "todo",
    label: "todo",
    labelVisible: "todo",
    min: "todo",
    max: "todo",
    opacity: "todo",
    scale: "todo",
    size: "todo",
    ticksVisible: "todo",
    visible: "todo",
    calculatedVisibility: "todo",
    useCalculatedVisibility: "todo",
    width: "todo",
    zBias: "todo",
    zIndex: "todo",
    zOrder: "todo",
    start: "todo",
    end: "todo",
    divisions: "todo",
  },
  [MIT.Grid]: {
    axes: "todo",
    description: "todo",
    divisions: "todo",
    color: "todo",
    opacity: "todo",
    snap: "todo",
    visible: "todo",
    calculatedVisibility: "todo",
    useCalculatedVisibility: "todo",
    width: "todo",
    zBias: "todo",
    zIndex: "todo",
    zOrder: "todo",
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
    zIndex: "drawn",
    // Left `todo` for the transparency task, which decides draw order.
    zOrder: "todo",
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
    color: "todo",
    description: "todo",
    opacity: "todo",
    visible: "todo",
    calculatedVisibility: "todo",
    useCalculatedVisibility: "todo",
    samples: "todo",
    shaded: "todo",
    domain: "todo",
    lhs: "todo",
    rhs: "todo",
    zBias: "todo",
    zIndex: "todo",
    zOrder: "todo",
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
