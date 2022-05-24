import type {
  IMathItemConfig,
  MathItemGenerator,
  IMathItem,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";
import {
  color,
  description,
  opacity,
  visible,
  size,
  width,
  zBias,
  zIndex,
  start,
  end,
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
  range: string;
  samples: string;
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
  range: "[-2*pi, 2*pi]",
  samples: "128",
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
    range: {
      name: "range",
      label: "Range",
      widget: WidgetType.MathValue,
    },
    samples: {
      name: "samples",
      label: "Samples",
      widget: WidgetType.MathValue,
    },
  },
  settingsProperties: [
    "opacity",
    "size",
    "start",
    "end",
    "samples",
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

export type { ParametricCurveProperties, ParametricCurve };
export { config };
