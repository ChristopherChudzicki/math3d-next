import { MathItemType as MIT } from "@/configs";
import React from "react";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;
const errorNames = [...exprNames] as const;

const ParametricSurface: MathItemForm<MIT.ParametricCurve> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    exprNames={exprNames}
    errorNames={errorNames}
  />
);

export default ParametricSurface;
