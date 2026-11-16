import type { MathGraphic } from "@math3d/mathitem-configs";
import React from "react";
import { Icon } from "@iconify/react/offline";
import type { IconifyIcon } from "@iconify/react/offline";
import circleAlert from "@iconify-icons/lucide/circle-alert";
import hand from "@iconify-icons/lucide/hand";
import link2 from "@iconify-icons/lucide/link-2";
import classNames from "classnames";
import { Popover } from "@/ui/Popover";
import ReadonlyMathField from "@/features/editor/items/FieldWidget/ReadonlyMathField";
import { visibilityMode } from "@/store/scene/state/util";
import { useMathErrors } from "@/store/scene/evaluation/mathScope";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";
import FollowSwitch from "./FollowSwitch";
import styles from "./VisibilityBadge.module.css";

const CALCULATED_VISIBILITY = ["calculatedVisibility"] as const;

type Badge = { icon: IconifyIcon; label: string; text: string };
const BADGES: Record<"following" | "manual" | "error", Badge> = {
  following: {
    icon: link2,
    label: "Calculated Visibility: following",
    text: "Follows its Calculated Visibility:",
  },
  manual: {
    icon: hand,
    label: "Calculated Visibility: set by hand",
    text: "Shown or hidden by hand until its Calculated Visibility changes value:",
  },
  error: {
    icon: circleAlert,
    label: "Calculated Visibility: error",
    text: "Its Calculated Visibility has an error, so it's shown:",
  },
};

/**
 * A mark on an item's visibility dot saying what decides visibility, when it
 * has a Calculated Visibility. Opens a popover that explains it and has the
 * Follow switch.
 */
const VisibilityBadge: React.FC<{ item: MathGraphic }> = ({ item }) => {
  const errors = useMathErrors(useMathScope(), item.id, CALCULATED_VISIBILITY);
  const mode = visibilityMode(item.properties);
  if (mode === "none") return null;
  const error = mode === "following" ? errors.calculatedVisibility : undefined;
  const badge = BADGES[error ? "error" : mode];
  return (
    <Popover.Root>
      <Popover.Trigger
        render={
          <button
            type="button"
            aria-label={badge.label}
            className={classNames(styles.badge, {
              [styles.error]: error,
            })}
          >
            <Icon icon={badge.icon} aria-hidden="true" />
          </button>
        }
      />
      <Popover.Popup side="right" align="start" data-dndkit-no-drag>
        <div className={styles.content}>
          <Popover.Description className={styles.text}>
            {badge.text}
          </Popover.Description>
          <ReadonlyMathField
            className={styles.expression}
            value={item.properties.calculatedVisibility}
          />
          {error ? <p className={styles.message}>{error.message}</p> : null}
          <div className={styles.follow}>
            <FollowSwitch item={item} />
          </div>
        </div>
      </Popover.Popup>
    </Popover.Root>
  );
};

export default VisibilityBadge;
