import type {
  MathItemConfig,
  MathItemGenerator,
  MathItemGeneric,
} from "../interfaces";
import { MathItemType, WidgetType } from "../constants";

interface LineProperties {
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
  coords: string;
}

const defaultValues: LineProperties = {
  description: "Line",
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
  end: "false",
  coords: "[[-1,1,-1],[1,1,1]]",
};

const make: MathItemGenerator<MathItemType.Line, LineProperties> = (id) => ({
  id,
  type: MathItemType.Line,
  properties: { ...defaultValues },
});

const config: MathItemConfig<MathItemType.Line, LineProperties> = {
  type: MathItemType.Line,
  label: "Line",
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

type Line = MathItemGeneric<MathItemType.Line, LineProperties>;

export type { LineProperties, Line };
export { config };
