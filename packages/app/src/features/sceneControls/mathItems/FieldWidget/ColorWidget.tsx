import classNames from "classnames";
import { getColorConfig, isMathGraphic } from "@math3d/mathitem-configs";
import React, { useId } from "react";
import invariant from "tiny-invariant";
import { useAppSelector } from "@/store/hooks";
import { Popover } from "@/ui/Popover";
import * as u from "@/util/styles/utils.module.css";
import ColorPopup from "../ColorStatus/ColorPopup";
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
  const valueId = useId();
  const color = getColorConfig(value);
  return (
    <div className={classNames(styles.field, className)} style={style}>
      <Popover.Root modal="trap-focus">
        <Popover.Trigger
          render={
            <button
              type="button"
              aria-labelledby={[labelledBy, valueId].filter(Boolean).join(" ")}
              aria-describedby={describedBy}
              className={styles.swatch}
              style={{ background: color.backgroundPreview }}
            />
          }
        />
        <ColorPopup item={item} />
      </Popover.Root>
      <span id={valueId} className={u.visuallyHidden}>
        {color.label || value}
      </span>
    </div>
  );
};

export default ColorWidget;
