import React from "react";
import { MathItem, MathItemType as MIT } from "types";
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

const getMathItemForm = (type: MIT) => {
  switch (type) {
    case MIT.Axis:
      return Axis;
    case MIT.BooleanVariable:
      return BooleanVariable;
    case MIT.Camera:
      return Camera;
    case MIT.ExplicitSurface:
      return ExplicitSurface;
    case MIT.ExplicitSurfacePolar:
      return ExplicitSurfacePolar;
    case MIT.Folder:
      return Folder;
    case MIT.Grid:
      return Grid;
    case MIT.ImplicitSurface:
      return ImplicitSurface;
    case MIT.Line:
      return Line;
    case MIT.ParametricCurve:
      return ParametricCurve;
    case MIT.ParametricSurface:
      return ParametricSurface;
    case MIT.Point:
      return Point;
    case MIT.Variable:
      return Variable;
    case MIT.VariableSlider:
      return VariableSlider;
    case MIT.Vector:
      return Vector;
    case MIT.VectorField:
      return VectorField;
    default:
      throw new Error(`Unexpected type: '${type}'.`);
  }
};

interface Props {
  item: MathItem;
}
const MathItemComponent = (props: Props) => {
  const Component = getMathItemForm(props.item.type);
  return <Component item={props.item} />;
};

export default MathItemComponent;
