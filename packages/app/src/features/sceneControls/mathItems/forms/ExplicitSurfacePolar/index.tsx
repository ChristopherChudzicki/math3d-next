import React, { useEffect } from "react";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { MathItemForm } from "../interfaces";
import RangedMathItemForm from "../RangedMathItemForm";
import { usePatchPropertyOnChange } from "../../FieldWidget";

const exprNames = ["expr"] as const;

const ExplicitSurfacePolar: MathItemForm<MIT.ExplicitSurfacePolar> = ({
  item,
}) => {
  const { expr } = item.properties;
  const patchProperty = usePatchPropertyOnChange(item);
  useEffect(() => {
    const params = ["X", "Y", "Z", ...expr.params];
    patchProperty({ name: "colorExpr", value: params }, "params", true);
  }, [expr.params, patchProperty]);
  return <RangedMathItemForm item={item} exprNames={exprNames} />;
};

export default ExplicitSurfacePolar;
