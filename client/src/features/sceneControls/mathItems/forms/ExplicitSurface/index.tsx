import React from "react";
import { MathItemType as MIT } from "@/configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;

const ExplicitSurface: MathItemForm<MIT.ExplicitSurface> = ({ item }) => (
  <RangedMathItemForm item={item} exprNames={exprNames} />
);

export default ExplicitSurface;
