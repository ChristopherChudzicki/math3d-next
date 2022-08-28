import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  gridOpacity,
  grid1,
  grid2,
  gridWidth,
  opacity,
  param1,
  param2,
  range1,
  range2,
  shaded,
  samples1,
  visible,
  samples2,
  zBias,
  zIndex,
} from "../shared";

interface ParametricSurfaceProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  shaded: string; // eval to boolean;
  expr: string;
  param1: string;
  param2: string;
  range1: string;
  range2: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  samples1: string;
  samples2: string;
  grid1: string;
  grid2: string;
}

const defaultValues: ParametricSurfaceProperties = {
  description: "Parametric Surface",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: "_f(u,v)=[1,1,1]",
  param1: "u",
  param2: "v",
  range1: "[-pi, pi]",
  range2: "[-3, 3]",
  colorExpr: "_f(X, Y, Z, u, v)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  samples1: "64",
  samples2: "64",
  grid1: "8",
  grid2: "8",
};

const make: MathItemGenerator<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
> = (id) => ({
  id,
  type: MathItemType.ParametricSurface,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
> = {
  type: MathItemType.ParametricSurface,
  label: "Parametric Surface",
  properties: {
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
    },
    colorExpr: {
      name: "colorExpr",
      label: "Expression",
      widget: WidgetType.MathValue,
    },
    color,
    description,
    gridOpacity,
    grid1,
    grid2,
    gridWidth,
    opacity,
    param1,
    param2,
    range1,
    range2,
    shaded,
    samples1,
    samples2,
    visible,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "gridOpacity",
    "grid1",
    "grid2",
    "gridWidth",
    "opacity",
    "shaded",
    "samples1",
    "samples2",
    "visible",
    "zBias",
    "zIndex",
  ],
  make,
};

type ParametricSurface = IMathItem<
  MathItemType.ParametricSurface,
  ParametricSurfaceProperties
>;

export type { ParametricSurface, ParametricSurfaceProperties };
export { config };
