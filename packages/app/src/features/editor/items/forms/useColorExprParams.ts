import { useEffect } from "react";
import { isEqual } from "lodash-es";
import {
  colorExprParams,
  MathItem,
  MathItemType as MIT,
} from "@math3d/mathitem-configs";
import { usePatchPropertyOnChange } from "@/features/editor/items/FieldWidget";

type Surface =
  | MathItem<MIT.ExplicitSurface>
  | MathItem<MIT.ExplicitSurfacePolar>
  | MathItem<MIT.ParametricSurface>;

const KIND = {
  [MIT.ExplicitSurface]: "explicit",
  [MIT.ExplicitSurfacePolar]: "polar",
  [MIT.ParametricSurface]: "parametric",
} as const;

/**
 * Keeps a surface's color function parameters in step with the surface's
 * own. The patch is derived, never an edit, so it leaves the scene clean.
 */
const useColorExprParams = (item: Surface) => {
  const { expr, colorExpr } = item.properties;
  const patchProperty = usePatchPropertyOnChange(item);
  const kind = KIND[item.type];
  useEffect(() => {
    const params = colorExprParams(kind, expr.params, colorExpr.params);
    if (isEqual(params, colorExpr.params)) return;
    patchProperty({ name: "colorExpr", value: params }, "params", true);
  }, [kind, expr.params, colorExpr.params, patchProperty]);
};

export { useColorExprParams };
