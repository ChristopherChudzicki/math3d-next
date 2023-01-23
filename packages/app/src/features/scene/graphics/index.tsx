import { MathItemType, MathItem, MathGraphic } from "@/configs";

import React from "react";
import Point from "./Point";
import Grid from "./Grid";
import Axis from "./Axis";

const NotImplemented: React.FC<{ item: MathItem }> = () => null;

const graphics = {
  [MathItemType.Point]: Point,
  [MathItemType.Axis]: Axis,
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

const Graphic: React.FC<{ item: MathGraphic }> = React.memo(({ item }) => {
  const Component = getGraphic(item);
  return <Component item={item} />;
});
Graphic.displayName = "Graphic";

export { Graphic };
