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
  isCollapsed: string // eval to boolean;
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
  isAnimating: string // eval to boolean;
  speedMultiplier: string // eval to number;
};
type BooleanVariableProperties = {
  name: string;
  value: string // eval to boolean
  description: string;
};

export type CameraProperties = {
  description: string;
  isOrthographic: string // eval to boolean
  isPanEnabled: string // eval to boolean
  isZoomEnabled: string // eval to boolean
  isRotateEnabled: string // eval to boolean
  // relativePosition: number[];
  // relativeLookAt: number[];
  computedPosition: string;
  computedLookAt: string;
  useComputed: string // eval to boolean
};
export type AxisProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  min: string;
  max: string;
  axis: "x" | "y" | "z";
  scale: string;
  ticksVisible: string;
  size: string;
  width: string;
};
export type GridProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  width: string;
  divisions: string;
  snap: string; // eval to boolean
  axes: "xy" | "yz" | "zx";
};

export type PointProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  coords: string;
  size: string;
};
type LineProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  size: string;
  width: string;
  start: string; // eval to boolean;
  end: string; // eval to boolean;
  coords: string;
};
type VectorProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  size: string;
  width: string;
  start: string // eval to boolean;
  end: string // eval to boolean;
  components: string;
  tail: string;
};
type ParametricCurveProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  size: string;
  width: string;
  start: string // eval to boolean;
  end: string // eval to boolean;
  expr: string;
  range: string;
  samples: string;
};

type ParametricSurfaceProperties = {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string // eval to boolean;
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
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;
  shaded: string // eval to boolean;
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
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string // eval to boolean;
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
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string // eval to boolean;
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
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  size: string;
  width: string;
  start: string // eval to boolean;
  end: string // eval to boolean;
  rangeX: string;
  rangeY: string;
  rangeZ: string;
  expr: string;
  samples: string;
  scale: string;
};

interface MathItemGeneric<T extends MathItemType, P extends MathItemProperties> {
  id: string;
  type: T;
  properties: P;
}

interface MathItemProperties extends Record<string, string> {
  description: string;
}

export type Variable = MathItemGeneric<MathItemType.Variable, VariableProperties>;
export type VariableSlider = MathItemGeneric<MathItemType.Variable, VariableSliderProperties>;
export type BooleanVariable = MathItemGeneric<MathItemType.BooleanVariable, BooleanVariableProperties>;

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

type MathItemPatchGeneric<T extends MathItem> = {
  [K in keyof Omit<T, 'properties'>]: T[K]
} & { properties: Partial<T['properties']> }

type PatchPatchAxis = MathItemPatchGeneric<Axis>
type PatchBooleanVariable = MathItemPatchGeneric<BooleanVariable>
type PatchCamera = MathItemPatchGeneric<Camera>
type PatchExplicitSurface = MathItemPatchGeneric<ExplicitSurface>
type PatchExplicitSurfacePolar = MathItemPatchGeneric<ExplicitSurfacePolar>
type PatchFolder = MathItemPatchGeneric<Folder>
type PatchGrid = MathItemPatchGeneric<Grid>
type PatchImplicitSurface = MathItemPatchGeneric<ImplicitSurface>
type PatchLine = MathItemPatchGeneric<Line>
type PatchParametricCurve = MathItemPatchGeneric<ParametricCurve>
type PatchParametricSurface = MathItemPatchGeneric<ParametricSurface>
type PatchPoint = MathItemPatchGeneric<Point>
type PatchVariable = MathItemPatchGeneric<Variable>
type PatchVariableSlider = MathItemPatchGeneric<VariableSlider>
type PatchVector = MathItemPatchGeneric<Vector>
type PatchVectorField = MathItemPatchGeneric<VectorField>

export type PatchMathItem = 
  | PatchPatchAxis
  | PatchBooleanVariable
  | PatchCamera
  | PatchExplicitSurface
  | PatchExplicitSurfacePolar
  | PatchFolder
  | PatchGrid
  | PatchImplicitSurface
  | PatchLine
  | PatchParametricCurve
  | PatchParametricSurface
  | PatchPoint
  | PatchVariable
  | PatchVariableSlider
  | PatchVector
  | PatchVectorField

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

interface PropertyConfig {
  readonly name: string
  readonly defaultValue: PropertyValue
  readonly widget: Widget
  readonly primaryOnly?: boolean
  readonly label: string
}
