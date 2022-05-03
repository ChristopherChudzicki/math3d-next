import { MathItemType as MIT, MathItems } from "types/mathItem";
import axisConfig from "./axis";
import booleanVariableConfig from "./booleanVariable";
import cameraConfig from "./camera";
import explicitSurfaceConfig from "./explicitSurface";
import explicitSurfacePolarConfig from "./explicitSurfacePolar";
import folderConfig from "./folder";
import gridConfig from "./grid";
import implicitSurfaceConfig from "./implicitSurface";
import lineConfig from "./line";
import parametricCurveConfig from "./parametricCurve";
import parametricSurfaceConfig from "./parametricSurface";
import * as point from "./point";
import * as variable from "./variable";
import variableSliderConfig from "./variableSlider";
import vectorConfig from "./vector";
import vectorFieldConfig from "./vectorField";

const configs = {
  [MIT.Axis]: axisConfig,
  [MIT.BooleanVariable]: booleanVariableConfig,
  [MIT.Camera]: cameraConfig,
  [MIT.ExplicitSurface]: explicitSurfaceConfig,
  [MIT.ExplicitSurfacePolar]: explicitSurfacePolarConfig,
  [MIT.Folder]: folderConfig,
  [MIT.Grid]: gridConfig,
  [MIT.ImplicitSurface]: implicitSurfaceConfig,
  [MIT.Line]: lineConfig,
  [MIT.ParametricCurve]: parametricCurveConfig,
  [MIT.ParametricSurface]: parametricSurfaceConfig,
  [MIT.Point]: point.config,
  [MIT.Variable]: variable.config,
  [MIT.VariableSlider]: variableSliderConfig,
  [MIT.Vector]: vectorConfig,
  [MIT.VectorField]: vectorFieldConfig,
};

const makers = {
  // [MIT.Axis]: axisConfig,
  // [MIT.BooleanVariable]: booleanVariableConfig,
  // [MIT.Camera]: cameraConfig,
  // [MIT.ExplicitSurface]: explicitSurfaceConfig,
  // [MIT.ExplicitSurfacePolar]: explicitSurfacePolarConfig,
  // [MIT.Folder]: folderConfig,
  // [MIT.Grid]: gridConfig,
  // [MIT.ImplicitSurface]: implicitSurfaceConfig,
  // [MIT.Line]: lineConfig,
  // [MIT.ParametricCurve]: parametricCurveConfig,
  // [MIT.ParametricSurface]: parametricSurfaceConfig,
  [MIT.Point]: point.make,
  [MIT.Variable]: variable.make,
  // [MIT.VariableSlider]: variableSliderConfig,
  // [MIT.Vector]: vectorConfig,
  // [MIT.VectorField]: vectorFieldConfig,
};

export type AddableTypes = keyof typeof makers;
type Addable = MathItems[AddableTypes];

const make = (id: string, type: AddableTypes): Addable => makers[type](id);

export { configs, make };
