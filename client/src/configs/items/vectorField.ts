import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

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

const config: MathItemConfig<MathItemType.VectorField, VectorFieldProperties> =
  {
    type: MathItemType.VectorField,
    label: "Vector Field",
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

type VectorField = MathItemGeneric<
  MathItemType.VectorField,
  VectorFieldProperties
>;

export type { VectorFieldProperties, VectorField };
export { config };
