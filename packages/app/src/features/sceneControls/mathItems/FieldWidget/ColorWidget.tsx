import { isMathGraphic } from "@math3d/mathitem-configs";
import React from "react";
import invariant from "tiny-invariant";
import { useAppSelector } from "@/store/hooks";
import { Popover } from "@/ui/Popover";
import ColorPopup, { getColor } from "../ColorStatus/ColorPopup";
import { select } from "../sceneSlice";
import { IWidgetProps } from "./types";
import styles from "./ColorWidget.module.css";

/** A swatch of the item's color that opens the color popover. */
const ColorWidget: React.FC<IWidgetProps> = ({
  itemId,
  value,
  className,
  style,
  "aria-labelledby": labelledBy,
  "aria-describedby": describedBy,
}) => {
  invariant(itemId, "ColorWidget requires itemId");
  const item = useAppSelector(select.mathItem(itemId));
  invariant(isMathGraphic(item), "ColorWidget requires a graphic item");
  const swatchStyle = {
    "--swatch-color": getColor(value).backgroundPreview,
  } as React.CSSProperties;
  return (
    <div className={className} style={style}>
      <Popover.Root modal="trap-focus">
        <Popover.Trigger
          render={
            <button
              type="button"
              aria-labelledby={labelledBy}
              aria-describedby={describedBy}
              className={styles.swatch}
              style={swatchStyle}
            />
          }
        />
        <ColorPopup item={item} />
      </Popover.Root>
    </div>
  );
};

export default ColorWidget;
