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
  domain1,
  end,
  opacity,
  size,
  start,
  visible,
  width,
  zBias,
  zIndex,
  samples1,
  EvaluatedDomain1,
} from "../shared";

interface ParametricCurveProperties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  size: string;
  width: string;
  start: string; // eval to boolean;
  end: string; // eval to boolean;
  expr: ParseableObjs["assignment"];
  domain: ParseableObjs["array"];
  samples1: string;
}

const defaultValues: ParametricCurveProperties = {
  description: "Parametric Curve",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  size: "6",
  width: "4",
  start: "false",
  end: "false",
  expr: { lhs: "_f(t)", rhs: "[cos(t), sin(t), t]", type: "assignment" },
  domain: {
    type: "array",
    items: [
      {
        type: "function-assignment",
        name: "_f",
        params: [],
        rhs: "[-2*pi, 2*pi]",
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
  visible: boolean;
  size: number;
  width: number;
  zBias: number;
  zIndex: number;
  start: boolean;
  end: boolean;
  samples1: number;
  domain: EvaluatedDomain1;
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
    },
    opacity,
    visible,
    size,
    width,
    zBias,
    zIndex,
    start,
    end,
    domain: domain1,
    samples1: { ...samples1, label: "Samples" },
  },
  settingsProperties: [
    "opacity",
    "size",
    "start",
    "end",
    "samples1",
    "width",
    "zBias",
    "zIndex",
  ],
  make,
};

type ParametricCurve = IMathItem<
  MathItemType.ParametricCurve,
  ParametricCurveProperties
>;

export type { ParametricCurve, ParametricCurveProperties };
export { config };
