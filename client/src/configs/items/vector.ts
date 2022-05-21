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
  size: string;
  width: string;
  start: string; // eval to boolean;
  end: string; // eval to boolean;
  components: string;
  tail: string;
}

const defaultValues: Properties = {
  description: "Vector",
  color: "#3090FF",
  visible: "true",
  opacity: "1",
  zIndex: "0",
  zBias: "0",
  label: "",
  labelVisible: "false",
  size: "6",
  width: "4",
  start: "false",
  end: "true",
  components: "[3,2,1]",
  tail: "[0,0,0]",
};

const make: MathItemGenerator<MathItemType.Vector, Properties> = (id) => ({
  id,
  type: MathItemType.Vector,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Vector, Properties> = {
  type: MathItemType.Vector,
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

type Vector = MathItemGeneric<MathItemType.Vector, Properties>;

export type { Properties, Vector };
export { config };
