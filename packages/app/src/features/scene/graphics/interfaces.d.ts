import { MathItem, MathGraphicType } from "@math3d/mathitem-configs/configs";
import React from "react";

type AxesRange = [[number, number], [number, number], [number, number]];

type GraphicProps<T extends MathGraphicType> = {
  item: MathItem<T>;
  range?: AxesRange;
};

type GraphicComponent<T = MathGraphicType> = React.FC<GraphicProps<T>>;

export { GraphicComponent, AxesRange };
