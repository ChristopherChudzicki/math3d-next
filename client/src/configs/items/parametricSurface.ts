import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import {
  color,
  description,
  gridOpacity,
  gridU,
  gridV,
  gridWidth,
  opacity,
  rangeU,
  rangeV,
  shaded,
  uSamples,
  vSamples,
  visible,
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
  rangeU: string;
  rangeV: string;
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  uSamples: string;
  vSamples: string;
  gridU: string;
  gridV: string;
}

const defaultValues: ParametricSurfaceProperties = {
  description: "Parametric Surface",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: "_f(u,v)=[v*cos(u), v*sin(u), v]",
  rangeU: "[-pi, pi]",
  rangeV: "[-3, 3]",
  colorExpr: "_f(X, Y, Z, u, v)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  uSamples: "64",
  vSamples: "64",
  gridU: "8",
  gridV: "8",
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
    gridU,
    gridV,
    gridWidth,
    opacity,
    rangeU,
    rangeV,
    shaded,
    uSamples,
    vSamples,
    visible,
    zBias,
    zIndex,
  },
  settingsProperties: [
    "gridOpacity",
    "gridU",
    "gridV",
    "gridWidth",
    "opacity",
    "rangeU",
    "rangeV",
    "shaded",
    "uSamples",
    "vSamples",
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

export type { ParametricSurfaceProperties, ParametricSurface };
export { config };
