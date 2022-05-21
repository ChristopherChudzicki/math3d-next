import * as R from "ramda";
import type { Validate } from "./interfaces";
import * as axis from "./items/axis";
import * as booleanVariable from "./items/booleanVariable";
import * as camera from "./items/camera";
import * as explicitSurface from "./items/explicitSurface";
import * as explicitSurfacePolar from "./items/explicitSurfacePolar";
import * as folder from "./items/folder";
import * as grid from "./items/grid";
import * as implicitSurface from "./items/implicitSurface";
import * as line from "./items/line";
import * as parametricCurve from "./items/parametricCurve";
import * as parametricSurface from "./items/parametricSurface";
import * as point from "./items/point";
import * as variable from "./items/variable";
import * as variableSlider from "./items/variableSlider";
import * as vector from "./items/vector";
import * as vectorField from "./items/vectorField";
import { MathItemType, WidgetType } from "./constants";

const mathItemConfigs = {
  [MathItemType.Axis]: axis.config,
  [MathItemType.BooleanVariable]: booleanVariable.config,
  [MathItemType.Camera]: camera.config,
  [MathItemType.ExplicitSurface]: explicitSurface.config,
  [MathItemType.ExplicitSurfacePolar]: explicitSurfacePolar.config,
  [MathItemType.Folder]: folder.config,
  [MathItemType.Grid]: grid.config,
  [MathItemType.ImplicitSurface]: implicitSurface.config,
  [MathItemType.Line]: line.config,
  [MathItemType.ParametricCurve]: parametricCurve.config,
  [MathItemType.ParametricSurface]: parametricSurface.config,
  [MathItemType.Point]: point.config,
  [MathItemType.Variable]: variable.config,
  [MathItemType.VariableSlider]: variableSlider.config,
  [MathItemType.Vector]: vector.config,
  [MathItemType.VectorField]: vectorField.config,
};

type Configs = typeof mathItemConfigs;

type MathItemConfig<T extends MathItemType = MathItemType> = Configs[T];

type MathItems = {
  [MathItemType.Axis]: axis.Axis;
  [MathItemType.BooleanVariable]: booleanVariable.BooleanVariable;
  [MathItemType.Camera]: camera.Camera;
  [MathItemType.ExplicitSurface]: explicitSurface.ExplicitSurface;
  [MathItemType.ExplicitSurfacePolar]: explicitSurfacePolar.ExplicitSurfacePolar;
  [MathItemType.Folder]: folder.Folder;
  [MathItemType.Grid]: grid.Grid;
  [MathItemType.ImplicitSurface]: implicitSurface.ImplicitSurface;
  [MathItemType.Line]: line.Line;
  [MathItemType.ParametricCurve]: parametricCurve.ParametricCurve;
  [MathItemType.ParametricSurface]: parametricSurface.ParametricSurface;
  [MathItemType.Point]: point.Point;
  [MathItemType.Variable]: variable.Variable;
  [MathItemType.VariableSlider]: variableSlider.VariableSlider;
  [MathItemType.Vector]: vector.Vector;
  [MathItemType.VectorField]: vectorField.VectorField;
};

type MathItem<T extends MathItemType = MathItemType> = MathItems[T];

type MathItemPatch<T extends MathItemType> = {
  id: MathItem<T>["id"];
} & { properties: Partial<MathItem<T>["properties"]> };

const getValidators = <T extends MathItemType>(
  config: MathItemConfig<T>
): Record<string, Validate | undefined> => {
  return Object.fromEntries(config.properties.map((p) => [p.name, p.validate]));
};

const validators = R.mapObjIndexed(getValidators, mathItemConfigs);

const addableTypes = [
  MathItemType.Point,
  MathItemType.Line,
  MathItemType.Vector,

  MathItemType.ParametricCurve,
  MathItemType.ParametricSurface,

  MathItemType.ExplicitSurface,
  MathItemType.ExplicitSurfacePolar,
  MathItemType.ImplicitSurface,
  MathItemType.VectorField,

  MathItemType.Variable,
  MathItemType.VariableSlider,
  MathItemType.BooleanVariable,

  MathItemType.Folder,
];

export { mathItemConfigs, MathItemType, WidgetType, validators, addableTypes };
export type { MathItemConfig, MathItem, MathItemPatch };