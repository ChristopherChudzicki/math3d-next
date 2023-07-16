import { MathItem, MathGraphicType } from "@math3d/mathitem-configs";
import React from "react";

type Coords = [number, number, number];
type AxesRange = [[number, number], [number, number], [number, number]];

type GraphicProps<T extends MathGraphicType> = {
  item: MathItem<T>;
  range?: AxesRange;
  zOrder?: number;
};

type GraphicComponent<T = MathGraphicType> = React.FC<GraphicProps<T>>;

export { GraphicComponent, AxesRange, Coords };
