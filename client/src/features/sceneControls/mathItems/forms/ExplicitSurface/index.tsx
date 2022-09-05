import React from "react";
import { MathItemType as MIT } from "@/configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const rangePropNames = ["range1", "range2"] as const;
const exprNames = ["expr"] as const;
const errorNames = [...exprNames, ...rangePropNames] as const;

const ExplicitSurface: MathItemForm<MIT.ExplicitSurface> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    exprNames={exprNames}
    errorNames={errorNames}
    rangePropNames={rangePropNames}
  />
);

export default ExplicitSurface;
