import { MathItemType as MIT } from "@math3d/mathitem-configs";
import React from "react";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;

const ParametricSurface: MathItemForm<MIT.ParametricCurve> = ({ item }) => (
  <RangedMathItemForm item={item} exprNames={exprNames} />
);

export default ParametricSurface;
