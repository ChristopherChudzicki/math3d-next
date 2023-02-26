import React from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;

const ExplicitSurfacePolar: MathItemForm<MIT.ExplicitSurfacePolar> = ({
  item,
}) => <RangedMathItemForm item={item} exprNames={exprNames} />;

export default ExplicitSurfacePolar;
