import { MathItemType as MIT } from "configs";
import React from "react";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["range1"] as const;
const exprNames = ["expr"] as const;
const errorNames = [...exprNames, ...rangePropNames] as const;

const ParametricSurface: MathItemForm<MIT.ParametricCurve> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    exprNames={exprNames}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ParametricSurface;
