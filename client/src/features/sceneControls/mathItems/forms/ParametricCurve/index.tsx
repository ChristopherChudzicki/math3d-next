import { MathItemType as MIT } from "configs";
import React from "react";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["range"] as const;
const errorNames = ["expr", ...rangePropNames] as const;

const ParametricSurface: MathItemForm<MIT.ParametricCurve> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ParametricSurface;
