import React from "react";
import { MathItemType as MIT } from "configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["rangeU", "rangeV"] as const;
const errorNames = ["expr", ...rangePropNames] as const;

const ParametricSurface: MathItemForm<MIT.ParametricSurface> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ParametricSurface;
