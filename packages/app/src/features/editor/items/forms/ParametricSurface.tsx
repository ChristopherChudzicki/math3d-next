import { MathItemType as MIT } from "@math3d/mathitem-configs";
import React from "react";

import { MathItemForm } from "./interfaces";
import RangedMathItemForm from "./RangedMathItemForm";
import { useColorExprParams } from "./useColorExprParams";

const exprNames = ["expr"] as const;

const ParametricSurface: MathItemForm<MIT.ParametricSurface> = ({ item }) => {
  useColorExprParams(item);
  return <RangedMathItemForm item={item} exprNames={exprNames} />;
};

export default ParametricSurface;
