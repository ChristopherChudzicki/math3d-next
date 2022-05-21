import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface Properties {
  description: string;
  color: string;
  visible: string;
  opacity: string;
  zIndex: string;
  zBias: string;

  label: string;
  labelVisible: string;
  min: string;
  max: string;
  axis: "x" | "y" | "z";
  scale: string;
  ticksVisible: string;
  size: string;
  width: string;
}

const defaultValues: Properties = {
  description: "Axis",
  color: "#808080",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "x",
  labelVisible: "true",
  min: "-5",
  max: "+5",
  axis: "x",
  scale: "1",
  ticksVisible: "true",
  size: "2",
  width: "1",
};

const make: MathItemGenerator<MathItemType.Axis, Properties> = (id) => ({
  id,
  type: MathItemType.Axis,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Axis, Properties> = {
  type: MathItemType.Axis,
  label: "Point",
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

type Axis = MathItemGeneric<MathItemType.Axis, Properties>;

export type { Properties, Axis };
export { config };
