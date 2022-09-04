import { MathItemType, WidgetType } from "../constants";
import type {
  IMathItem,
  IMathItemConfig,
  MathItemGenerator,
} from "../interfaces";
import {
  color,
  description,
  end,
  opacity,
  size,
  start,
  visible,
  width,
  zBias,
  zIndex,
  param1,
  range1,
  samples1,
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
  expr: string;
  param1: string;
  range1: string;
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
  expr: "_f(t)=[cos(t), sin(t), t]",
  param1: "t",
  range1: "[-2*pi, 2*pi]",
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

const config: IMathItemConfig<
  MathItemType.ParametricCurve,
  ParametricCurveProperties
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
    param1,
    range1: { ...range1, label: "Range" },
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
