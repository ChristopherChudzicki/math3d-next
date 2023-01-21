import { MathItemType, MathItem, MathGraphic } from "@/configs";

import React from "react";
import Point from "./Point";
import Grid from "./Grid";

const NotImplemented: React.FC<{ item: MathItem }> = () => null;

const graphics = {
  [MathItemType.Point]: Point,
  [MathItemType.Axis]: NotImplemented,
  [MathItemType.ExplicitSurface]: NotImplemented,
  [MathItemType.ExplicitSurfacePolar]: NotImplemented,
  [MathItemType.Grid]: Grid,
  [MathItemType.ImplicitSurface]: NotImplemented,
  [MathItemType.Line]: NotImplemented,
  [MathItemType.ParametricCurve]: NotImplemented,
  [MathItemType.ParametricSurface]: NotImplemented,
  [MathItemType.Vector]: NotImplemented,
  [MathItemType.VectorField]: NotImplemented,
};

const getGraphic = (item: MathGraphic): React.FC<{ item: MathGraphic }> => {
  const Graphic = graphics[item.type];
  // See https://stackoverflow.com/questions/69018617/typescript-and-object-literal-lookups
  // and https://twitter.com/SeaRyanC/status/1544414378383925250
  // @ts-expect-error (Graphics, item) are not corrrelated.
  return Graphic;
};

export { getGraphic };
