interface MathItemGeneric<T extends string, Props extends MathItemProperties> {
  id: string;
  type: T;
  properties: Props;
}

interface MathItemProperties
  extends Record<string, string | number | boolean | number[]> {
  description: string;
}

const FOLDER = "FOLDER";

const VARIABLE = "VARIABLE";
const VARIABLE_SLIDER = "VARIABLE_SLIDER";
const BOOLEAN_VARIABLE = "BOOLEAN_VARIABLE";

const CAMERA = "CAMERA";
const AXIS = "AXIS";
const GRID = "GRID";

const POINT = "POINT";
const LINE = "LINE";
const VECTOR = "VECTOR";
const PARAMETRIC_CURVE = "PARAMETRIC_CURVE";
const PARAMETRIC_SURFACE = "PARAMETRIC_SURFACE";
const EXPLICIT_SURFACE = "EXPLICIT_SURFACE";
const EXPLICIT_SURFACE_POLAR = "EXPLICIT_SURFACE_POLAR";
const IMPLICIT_SURFACE = "IMPLICIT_SURFACE";
const VECTOR_FIELD = "VECTOR_FIELD";

export const itemType = {
  FOLDER,
  VARIABLE,
  VARIABLE_SLIDER,
  BOOLEAN_VARIABLE,
  CAMERA,
  AXIS,
  GRID,
  POINT,
  LINE,
  VECTOR,
  PARAMETRIC_CURVE,
  PARAMETRIC_SURFACE,
  EXPLICIT_SURFACE,
  EXPLICIT_SURFACE_POLAR,
  IMPLICIT_SURFACE,
  VECTOR_FIELD,
};

type FolderPoperties = {
  description: string;
  isCollapsed: boolean;
};

type VariableProperties = {
  name: string;
  value: string;
  description: string;
};
type VariableSliderProperties = {
  name: string;
  value: string;
  min: string;
  max: string;
  description: string;
  isAnimating: boolean;
  speedMultiplier: number;
};
type BooleanVariableProperties = {
  name: string;
  value: boolean;
  description: string;
};

type CameraProperties = {
  description: string;
  isOrthographic: boolean;
  isPanEnabled: boolean;
  isZoomEnabled: boolean;
  isRotateEnabled: boolean;
  relativePosition: number[];
  relativeLookAt: number[];
  computedPosition: string;
  computedLookAt: string;
  useComputed: boolean;
};
type AxisProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  label: string;
  labelVisible: true;
  min: string;
  max: string;
  axis: "x" | "y" | "z";
  scale: string;
  ticksVisible: boolean;
  size: string;
  width: string;
};
type GridProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  width: string;
  divisions: string;
  snap: boolean;
  axes: "xy" | "yz" | "zx";
};

type PointProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  label: string;
  labelVisible: boolean;
  coords: string;
  size: string;
};
type LineProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  label: string;
  labelVisible: boolean;
  size: string;
  width: string;
  start: boolean;
  end: boolean;
  coords: string;
};
type VectorProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  label: string;
  labelVisible: boolean;
  size: string;
  width: string;
  start: boolean;
  end: boolean;
  components: string;
  tail: string;
};
type ParametricCurveProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  size: string;
  width: string;
  start: boolean;
  end: boolean;
  expr: string;
  range: string;
  samples: string;
};

type ParametricSurfaceProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  shaded: boolean;
  expr: string;
  rangeU: string;
  rangeV: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  uSamples: string;
  vSamples: string;
  gridU: string;
  gridV: string;
};
type ExplicitSurfaceProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  shaded: boolean;
  expr: string;
  rangeU: string;
  rangeV: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  uSamples: string;
  vSamples: string;
  gridU: string;
  gridV: string;
};
type ExplicitSurfacePolarProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  shaded: boolean;
  expr: string;
  rangeU: string;
  rangeV: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  uSamples: string;
  vSamples: string;
  gridU: string;
  gridV: string;
};
type ImplicitSurfaceProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  shaded: boolean;
  rangeX: string;
  rangeY: string;
  rangeZ: string;
  lhs: string;
  rhs: string;
  samples: string;
};

type VectorFieldProperties = {
  description: string;
  color: string;
  visible: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  calculatedVisibility: string;
  size: string;
  width: string;
  start: boolean;
  end: boolean;
  rangeX: string;
  rangeY: string;
  rangeZ: string;
  expr: string;
  samples: string;
  scale: string;
};

export type Variable = MathItemGeneric<typeof VARIABLE, VariableProperties>;
export type VariableSlider = MathItemGeneric<
  typeof VARIABLE_SLIDER,
  VariableSliderProperties
>;
export type BooleanVariable = MathItemGeneric<
  typeof BOOLEAN_VARIABLE,
  BooleanVariableProperties
>;

export type Camera = MathItemGeneric<typeof CAMERA, CameraProperties>;
export type Axis = MathItemGeneric<typeof AXIS, AxisProperties>;
export type Grid = MathItemGeneric<typeof GRID, GridProperties>;

export type Point = MathItemGeneric<typeof POINT, PointProperties>;
export type Line = MathItemGeneric<typeof LINE, LineProperties>;
export type Vector = MathItemGeneric<typeof VECTOR, VectorProperties>;
export type ParametricCurve = MathItemGeneric<
  typeof PARAMETRIC_CURVE,
  ParametricCurveProperties
>;

export type ParametricSurface = MathItemGeneric<
  typeof PARAMETRIC_SURFACE,
  ParametricSurfaceProperties
>;
export type ExplicitSurface = MathItemGeneric<
  typeof EXPLICIT_SURFACE,
  ExplicitSurfaceProperties
>;
export type ExplicitSurfacePolar = MathItemGeneric<
  typeof EXPLICIT_SURFACE_POLAR,
  ExplicitSurfacePolarProperties
>;
export type ImplicitSurface = MathItemGeneric<
  typeof IMPLICIT_SURFACE,
  ImplicitSurfaceProperties
>;

export type VectorField = MathItemGeneric<
  typeof VECTOR_FIELD,
  VectorFieldProperties
>;

export type Folder = MathItemGeneric<typeof FOLDER, FolderPoperties>;

export type MathVariable = Variable | VariableSlider | BooleanVariable;

export type MathGraphic =
  | Axis
  | Grid
  | Camera
  | Point
  | Line
  | Vector
  | ParametricCurve
  | ParametricSurface
  | ExplicitSurface
  | ExplicitSurfacePolar
  | ImplicitSurface
  | VectorField;

export type MathItem = MathVariable | MathGraphic | Folder;
