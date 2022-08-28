import React from "react";
import { MathItemType as MIT } from "configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["range1", "range2"] as const;
const errorNames = ["expr", ...rangePropNames] as const;

const ExplicitSurfacePolar: MathItemForm<MIT.ExplicitSurfacePolar> = ({
  item,
}) => (
  <RangedMathItemForm
    item={item}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ExplicitSurfacePolar;
