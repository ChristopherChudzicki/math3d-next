import React from 'react'
import { MathItem, MathItemType as MIT } from "types";
import Axis from "./Axis";
import BooleanVariable from "./BooleanVariable";
import Camera from "./Camera";
import ExplicitSurface from "./ExplicitSurface";
import ExplicitSurfacePolar from "./ExplicitSurfacePolar";
import Folder from "./Folder";
import Grid from "./Grid";
import ImplicitSurface from "./ImplicitSurface";
import Line from "./Line";
import ParametricCurve from "./ParametricCurve";
import ParametricSurface from "./ParametricSurface";
import Point from "./Point";
import Variable from "./Variable";
import VariableSlider from "./VariableSlider";
import Vector from "./Vector";
import VectorField from "./VectorField";

const getMathItemComponent = (type: MIT) => {
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
      throw new Error(`Unexpected type: '${type}'.`)
  }
};

interface Props {
  item: MathItem,
}
const MathItemComponent = (props: Props) => {
  const Component = getMathItemComponent(props.item.type)
  return <Component item={props.item} />
}

export default MathItemComponent;
