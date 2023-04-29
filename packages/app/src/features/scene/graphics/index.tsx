import { MathItemType, MathItem, MathGraphic } from "@math3d/mathitem-configs";

import React from "react";
import Point from "./Point";
import Grid from "./Grid";
import Axis from "./Axis";
import Line from "./Line";
import Vector from "./Vector";
import ParametricCurve from "./ParametricCurve";
import {
  ParametricSurface,
  ExplicitSurface,
  ExplicitSurfacePolar,
} from "./ParametricSurface";
import { GraphicComponent } from "./interfaces";

const NotImplemented: React.FC<{ item: MathItem }> = () => null;

const graphics = {
  [MathItemType.Point]: Point,
  [MathItemType.Axis]: Axis,
  [MathItemType.ExplicitSurface]: ExplicitSurface,
  [MathItemType.ExplicitSurfacePolar]: ExplicitSurfacePolar,
  [MathItemType.Grid]: Grid,
  [MathItemType.ImplicitSurface]: NotImplemented,
  [MathItemType.Line]: Line,
  [MathItemType.ParametricCurve]: ParametricCurve,
  [MathItemType.ParametricSurface]: ParametricSurface,
  [MathItemType.Vector]: Vector,
  [MathItemType.VectorField]: NotImplemented,
};

const NEEDS_RANGE: MathItemType[] = [
  MathItemType.ParametricSurface,
  MathItemType.ExplicitSurface,
  MathItemType.ExplicitSurfacePolar,
];
const graphicNeedsRange = (type: MathItemType): boolean => {
  return NEEDS_RANGE.includes(type);
};

const getGraphic = (item: MathGraphic): GraphicComponent => {
  const Graphic = graphics[item.type];
  // See https://stackoverflow.com/questions/69018617/typescript-and-object-literal-lookups
  // and https://twitter.com/SeaRyanC/status/1544414378383925250
  // @ts-expect-error (Graphics, item) are not corrrelated.
  return Graphic;
};

const Graphic: GraphicComponent = React.memo(({ item, range }) => {
  const Component = getGraphic(item);
  return <Component item={item} range={range} />;
});
Graphic.displayName = "Graphic";

export { Graphic, graphicNeedsRange };
