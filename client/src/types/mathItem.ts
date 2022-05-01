export enum MathItemType {
  Folder = 'FOLDER',
  // variables
  Variable = "VARIABLE",
  VariableSlider = "VARIABLE_SLIDER",
  BooleanVariable = "BOOLEAN_VARIABLE",
  // special graphics
  Camera = "CAMERA",
  Axis = "AXIS",
  Grid = "GRID",
  Point = "POINT",
  Line = "LINE",
  Vector = "VECTOR",
  ParametricCurve = "PARAMETRIC_CURVE",
  ParametricSurface = "PARAMETRIC_SURFACE",
  ExplicitSurface = "EXPLICIT_SURFACE",
  ExplicitSurfacePolar = "EXPLICIT_SURFACE_POLAR",
  ImplicitSurface = "IMPLICIT_SURFACE",
  VectorField = "VECTOR_FIELD",
}

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

interface MathItemGeneric<
  T extends MathItemType,
  Props extends MathItemProperties
  > {
  id: string;
  type: T;
  properties: Props;
}

interface MathItemProperties
  extends Record<string, string | number | boolean | number[]> {
  description: string;
}

export type Variable = MathItemGeneric<MathItemType.Variable, VariableProperties>;
export type VariableSlider = MathItemGeneric<
  MathItemType.Variable,
  VariableSliderProperties
>;
export type BooleanVariable = MathItemGeneric<
  MathItemType.BooleanVariable,
  BooleanVariableProperties
>;

export type Camera = MathItemGeneric<MathItemType.Camera, CameraProperties>;
export type Axis = MathItemGeneric<MathItemType.Axis, AxisProperties>;
export type Grid = MathItemGeneric<MathItemType.Grid, GridProperties>;

export type Point = MathItemGeneric<MathItemType.Point, PointProperties>;
export type Line = MathItemGeneric<MathItemType.Line, LineProperties>;
export type Vector = MathItemGeneric<MathItemType.Vector, VectorProperties>;
export type ParametricCurve = MathItemGeneric<
  MathItemType.ParametricCurve,
  ParametricCurveProperties
>;

export type ParametricSurface = MathItemGeneric<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
>;
export type ExplicitSurface = MathItemGeneric<
  MathItemType.ExplicitSurface,
  ExplicitSurfaceProperties
>;
export type ExplicitSurfacePolar = MathItemGeneric<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
>;
export type ImplicitSurface = MathItemGeneric<
  MathItemType.ImplicitSurface,
  ImplicitSurfaceProperties
>;

export type VectorField = MathItemGeneric<
  typeof MathItemType.VectorField,
  VectorFieldProperties
>;

export type Folder = MathItemGeneric<MathItemType.Folder, FolderPoperties>;

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

export interface MathItemConfig {
  type: MathItemType;
  label: string;
  properties: PropertyConfig[];
}

export enum Widget {
  MathBoolean = 'math-boolean',
  MathValue = 'math-value',
  Color = 'color-picker',
  AutosizeText = 'autosize-text'
}


type PropertyValue = string | number | boolean | null;

interface PropertyConfig{
  readonly name: string
  readonly defaultValue: PropertyValue
  readonly widget: Widget
  readonly primaryOnly?: boolean
  readonly label: string
}
