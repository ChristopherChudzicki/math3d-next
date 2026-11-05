import { MathItem, MathGraphicType } from "@math3d/mathitem-configs";
import React from "react";

type GraphicProps<T extends MathGraphicType> = {
  item: MathItem<T>;
};

type GraphicComponent<T = MathGraphicType> = React.FC<GraphicProps<T>>;

export { GraphicComponent };
