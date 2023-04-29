import { MathItemType as MIT } from "@math3d/mathitem-configs";
import React, { useEffect } from "react";
import { usePatchPropertyOnChange } from "../../FieldWidget";

import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";

const exprNames = ["expr"] as const;

const ParametricSurface: MathItemForm<MIT.ParametricSurface> = ({ item }) => {
  const { expr } = item.properties;
  const patchProperty = usePatchPropertyOnChange(item);
  useEffect(() => {
    const params = ["X", "Y", "Z", ...expr.params];
    patchProperty({ name: "colorExpr", value: params }, "params");
  }, [expr.params, patchProperty]);
  return <RangedMathItemForm item={item} exprNames={exprNames} />;
};

export default ParametricSurface;
