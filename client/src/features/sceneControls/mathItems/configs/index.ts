import { MathItemType as MIT, MathItemConfig } from "types/mathItem";
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
import pointConfig from "./point";
import variableConfig from "./variable";
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
  [MIT.Point]: pointConfig,
  [MIT.Variable]: variableConfig,
  [MIT.VariableSlider]: variableSliderConfig,
  [MIT.Vector]: vectorConfig,
  [MIT.VectorField]: vectorFieldConfig,
};

export default configs;
