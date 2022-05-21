import React from "react";
import { MathItem, MathItemType as MIT } from "configs";
import type { MathItemForm } from "./forms/interfaces";
import Axis from "./forms/Axis";
import BooleanVariable from "./forms/BooleanVariable";
import Camera from "./forms/Camera";
import ExplicitSurface from "./forms/ExplicitSurface";
import ExplicitSurfacePolar from "./forms/ExplicitSurfacePolar";
import Folder from "./forms/Folder";
import Grid from "./forms/Grid";
import ImplicitSurface from "./forms/ImplicitSurface";
import Line from "./forms/Line";
import ParametricCurve from "./forms/ParametricCurve";
import ParametricSurface from "./forms/ParametricSurface";
import Point from "./forms/Point";
import Variable from "./forms/Variable";
import VariableSlider from "./forms/VariableSlider";
import Vector from "./forms/Vector";
import VectorField from "./forms/VectorField";

const forms = {
  [MIT.Axis]: Axis,
  [MIT.BooleanVariable]: BooleanVariable,
  [MIT.Camera]: Camera,
  [MIT.ExplicitSurface]: ExplicitSurface,
  [MIT.ExplicitSurfacePolar]: ExplicitSurfacePolar,
  [MIT.Folder]: Folder,
  [MIT.Grid]: Grid,
  [MIT.ImplicitSurface]: ImplicitSurface,
  [MIT.Line]: Line,
  [MIT.ParametricCurve]: ParametricCurve,
  [MIT.ParametricSurface]: ParametricSurface,
  [MIT.Point]: Point,
  [MIT.Variable]: Variable,
  [MIT.VariableSlider]: VariableSlider,
  [MIT.Vector]: Vector,
  [MIT.VectorField]: VectorField,
};

const getMathItemForm = <T extends MIT>(type: T): MathItemForm<T> => {
  return forms[type] as MathItemForm<T>;
};

interface Props<T extends MIT> {
  item: MathItem<T>;
}
const MathItemComponent = <T extends MIT>(props: Props<T>) => {
  const Component = getMathItemForm(props.item.type);
  return <Component item={props.item} />;
};

export default MathItemComponent;
