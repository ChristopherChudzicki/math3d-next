import type { MathItemConfig, MathItemGenerator } from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
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

const defaultValues: Properties = {
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

const make: MathItemGenerator<MathItemType.ParametricCurve, Properties> = (
  id
) => ({
  id,
  type: MathItemType.ParametricCurve,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.ParametricCurve, Properties> = {
  type: MathItemType.ParametricCurve,
  label: "Toggle Switch",
  properties: [
    {
      name: "description",
      label: "Description",
      widget: WidgetType.AutosizeText,
      primaryOnly: true,
    },
  ],
  make,
};

export type { Properties };
export { config };
