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
  zBias,
  zIndex,
  size,
  width,
  start,
  end,
} from "../shared";

interface VectorFieldProperties {
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
  rangeX: string;
  rangeY: string;
  rangeZ: string;
  expr: string;
  samples: string;
  scale: string;
}

const defaultValues: VectorFieldProperties = {
  description: "Vector Field",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  size: "6",
  width: "2",
  start: "false",
  end: "true",
  rangeX: "[-5,5]",
  rangeY: "[-5,5]",
  rangeZ: "[-5,5]",
  expr: "_f(x,y,z)=[y, -x]/sqrt(x^2 + y^2)",
  samples: "[10, 10, 5]",
  scale: "1",
};

const make: MathItemGenerator<
  MathItemType.VectorField,
  VectorFieldProperties
> = (id) => ({
  id,
  type: MathItemType.VectorField,
  properties: { ...defaultValues },
});

const config: IMathItemConfig<MathItemType.VectorField, VectorFieldProperties> =
  {
    type: MathItemType.VectorField,
    label: "Vector Field",
    properties: {
      color,
      description,
      opacity,
      visible,
      zBias,
      zIndex,
      size,
      width,
      start,
      end,
      rangeX: {
        name: "rangeX",
        label: "Range (X)",
        widget: WidgetType.MathValue,
      },
      rangeY: {
        name: "rangeY",
        label: "Range (Y)",
        widget: WidgetType.MathValue,
      },
      rangeZ: {
        name: "rangeZ",
        label: "Range (Z)",
        widget: WidgetType.MathValue,
      },
      samples: {
        name: "samples",
        label: "Samples",
        // [x, y, z] ... why is this different from surface sampling?
        widget: WidgetType.MathValue,
      },
      scale: {
        name: "scale",
        label: "Scale Multiplier",
        widget: WidgetType.MathValue,
      },
      expr: {
        name: "expr",
        label: "Expression",
        widget: WidgetType.MathValue,
      },
    },
    settingsProperties: [
      "opacity",
      "rangeX",
      "rangeY",
      "rangeZ",
      "size",
      "start",
      "end",
      "samples",
      "scale",
      "width",
      "zBias",
      "zIndex",
    ],
    make,
  };

type VectorField = IMathItem<MathItemType.VectorField, VectorFieldProperties>;

export type { VectorFieldProperties, VectorField };
export { config };
