import React from "react";
import { MathItemType as MIT } from "@/configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;
const errorNames = [...exprNames] as const;

const ParametricSurface: MathItemForm<MIT.VectorField> = ({ item }) => (
  <RangedMathItemForm
    item={item}
    exprNames={exprNames}
    errorNames={errorNames}
  />
);

export default ParametricSurface;
