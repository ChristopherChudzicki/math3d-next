import { ParseableObjs } from "@/util/parsing";
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
  shaded,
  samples1,
  visible,
  samples2,
  zBias,
  zIndex,
  domain2,
  EvaluatedDomain2,
} from "../shared";

interface ExplicitSurfacePolarProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;
  shaded: string; // eval to boolean;
  expr: ParseableObjs["function-assignment"];
  domain: ParseableObjs["array"];
  colorExpr: string;
  gridOpacity: string;
  gridWidth: string;
  samples1: string;
  samples2: string;
  grid1: string;
  grid2: string;
}

const defaultValues: ExplicitSurfacePolarProperties = {
  description: "Explicit Surface (Polar)",
  color: "#3090FF",
  visible: "true",
  opacity: "0.75",
  zIndex: "0",
  zBias: "0",
  shaded: "true",
  expr: {
    type: "function-assignment",
    name: "_f",
    params: ["r", "Q"],
    rhs: "\\frac{1}{4}r^2*cos(3*Q)]",
  },
  domain: {
    type: "array",
    items: [
      {
        type: "function-assignment",
        name: "_f",
        params: ["Q"],
        rhs: "[0, 3]",
      },
      {
        type: "function-assignment",
        name: "_f",
        params: ["r"],
        rhs: "[-pi, pi]",
      },
    ],
  },
  colorExpr: "_f(X, Y, Z, r, theta)=mod(Z, 1)",
  gridOpacity: "0.5",
  gridWidth: "2",
  samples1: "64",
  samples2: "64",
  grid1: "8",
  grid2: "8",
};

const make: MathItemGenerator<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
> = (id) => ({
  id,
  type: MathItemType.ExplicitSurfacePolar,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  gridOpacity: number;
  grid1: number;
  grid2: number;
  gridWidth: number;
  opacity: number;
  domain: EvaluatedDomain2;
  shaded: boolean;
  samples1: number;
  samples2: number;
  visible: boolean;
  zBias: number;
  zIndex: number;
};

const config: IMathItemConfig<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties,
  EvaluatedProperties
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
    grid1,
    grid2,
    gridWidth,
    opacity,
    domain: domain2,
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

type ExplicitSurfacePolar = IMathItem<
  MathItemType.ExplicitSurfacePolar,
  ExplicitSurfacePolarProperties
>;

export type { ExplicitSurfacePolar, ExplicitSurfacePolarProperties };
export { config };
