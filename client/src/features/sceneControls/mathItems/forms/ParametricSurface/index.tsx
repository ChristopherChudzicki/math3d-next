import { MathItemType as MIT } from "configs";
import React from "react";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["range1", "range2"] as const;
const errorNames = ["expr", ...rangePropNames] as const;

const ParametricSurface: MathItemForm<MIT.ParametricSurface> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ParametricSurface;
