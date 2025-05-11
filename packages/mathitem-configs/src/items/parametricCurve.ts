import { ParseableArray, ParseableObjs } from "@math3d/parser";
import { validators } from "@math3d/validators";
import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  domain1,
  end,
  opacity,
  size,
  start,
  visibilityProps,
  width,
  zBias,
  zIndex,
  zOrder,
  samples1,
  EvaluatedDomain1,
} from "../shared";

interface ParametricCurveProperties {
  description: string;
  color: string;
  visible: boolean;
  calculatedVisibility: "";
  useCalculatedVisibility: boolean;
  opacity: string;
  zIndex: string;
  zBias: string;
  zOrder: string;
  size: string;
  width: string;
  start: string;
  end: string;
  expr: ParseableObjs["function-assignment"];
  domain: ParseableArray<ParseableObjs["expr"]>;
  samples1: string;
}

const defaultValues: ParametricCurveProperties = {
  description: "Parametric Curve",
  color: "#3090FF",
  visible: true,
  calculatedVisibility: "",
  useCalculatedVisibility: false,
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  zOrder: "",
  size: "6",
  width: "4",
  start: "false",
  end: "false",
  expr: {
    type: "function-assignment",
    name: "_f",
    params: ["t"],
    rhs: "\\left[\\cos(t), \\sin(t), t\\right]",
  },
  domain: {
    type: "array",
    items: [
      {
        type: "expr",
        expr: "\\left[-2\\pi, 2\\pi\\right]",
      },
    ],
  },
  samples1: "128",
};

const make: MathItemGenerator<
  MathItemType.ParametricCurve,
  ParametricCurveProperties
> = (id) => ({
  id,
  type: MathItemType.ParametricCurve,
  properties: { ...defaultValues },
});

type EvaluatedProperties = {
  opacity: number;
  calculatedVisibility: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
  zOrder: number;
  start: boolean;
  end: boolean;
  samples1: number;
  domain: EvaluatedDomain1;
  expr: (x: number) => [number, number, number];
};

const config: IMathItemConfig<
  MathItemType.ParametricCurve,
  ParametricCurveProperties,
  EvaluatedProperties
> = {
  type: MathItemType.ParametricCurve,
  label: "Parametric Curve",
  properties: {
    color,
    description,
    expr: {
      name: "expr",
      label: "Expression",
      widget: WidgetType.MathValue,
      validate: validators.realFunc[1][3],
    },
    opacity,
    ...visibilityProps,
    size,
    width,
    zBias,
    zIndex,
    zOrder,
    start,
    end,
    domain: domain1,
    samples1: { ...samples1, label: "Samples" },
  },
  settingsProperties: [
    "calculatedVisibility",
    "opacity",
    "size",
    "start",
    "end",
    "samples1",
    "width",
    "zBias",
    "zIndex",
    "zOrder",
  ],
  make,
};

type ParametricCurve = IMathItem<
  MathItemType.ParametricCurve,
  ParametricCurveProperties
>;

export type { ParametricCurve, ParametricCurveProperties, EvaluatedProperties };
export { config };
