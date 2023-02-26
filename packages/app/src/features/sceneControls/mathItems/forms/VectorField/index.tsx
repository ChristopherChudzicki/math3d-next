import React from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;

const ParametricSurface: MathItemForm<MIT.VectorField> = ({ item }) => (
  <RangedMathItemForm item={item} exprNames={exprNames} />
);

export default ParametricSurface;
