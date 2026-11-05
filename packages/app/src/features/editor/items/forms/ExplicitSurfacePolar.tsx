import React from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { MathItemForm } from "./interfaces";
import RangedMathItemForm from "./RangedMathItemForm";
import { useColorExprParams } from "./useColorExprParams";

const exprNames = ["expr"] as const;

const ExplicitSurfacePolar: MathItemForm<MIT.ExplicitSurfacePolar> = ({
  item,
}) => {
  useColorExprParams(item);
  return <RangedMathItemForm item={item} exprNames={exprNames} />;
};

export default ExplicitSurfacePolar;
