import {
  MathGraphic,
  makeColorConfig,
  colorsAndGradients,
} from "@math3d/mathitem-configs";
import React from "react";
import { Popover } from "@/ui/Popover";
import CloseButton from "../templates/CloseButton";
import ColorDialog from "./ColorDialog";
import styles from "./ColorPopup.module.css";

const getColor = (colorText: string) => {
  const color = colorsAndGradients.find((c) => c.value === colorText);
  return color ?? makeColorConfig(colorText, "");
};

interface ColorPopupProps {
  item: MathGraphic;
  /** Positions the popup when the popover has no `Popover.Trigger`. */
  anchor?: Element | null;
}

/** The color popover's surface. Render it in a `Popover.Root`. */
const ColorPopup: React.FC<ColorPopupProps> = ({ item, anchor }) => (
  <Popover.Popup anchor={anchor} side="right" data-dndkit-no-drag>
    <div className={styles.header}>
      <Popover.Title>Color</Popover.Title>
      <Popover.Close render={<CloseButton label="Close" />} />
    </div>
    <ColorDialog className={styles.dialog} item={item} />
  </Popover.Popup>
);

export default ColorPopup;
export { getColor };
