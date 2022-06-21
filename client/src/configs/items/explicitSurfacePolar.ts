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
  gridU,
  gridV,
  gridWidth,
  opacity,
  rangeU,
  rangeV,
  shaded,
  uSamples,
  visible,
  vSamples,
  zBias,
  zIndex,
} from "../shared";

interface ExplicitSurfacePolarProperties {
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

const defaultValues: ExplicitSurfacePolarProperties = {
  description: "Explicit Surface (Polar)",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: "_f(r, Q)=\\frac{1}{4}r^2*cos(3*Q)",
  rangeU: "[0, 3]",
  rangeV: "[-pi, pi]",
  colorExpr: "_f(X, Y, Z, r, theta)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  uSamples: "64",
  vSamples: "64",
  gridU: "8",
  gridV: "8",
};

const make: MathItemGenerator<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
> = (id) => ({
  id,
  type: MathItemType.ExplicitSurfacePolar,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
> = {
  type: MathItemType.ExplicitSurfacePolar,
  label: "Explicit Surface (Polar)",
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

type ExplicitSurfacePolar = IMathItem<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
>;

export type { ExplicitSurfacePolar, ExplicitSurfacePolarProperties };
export { config };
