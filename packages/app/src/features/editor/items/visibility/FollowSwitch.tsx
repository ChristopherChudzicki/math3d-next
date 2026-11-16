import type { MathGraphic } from "@math3d/mathitem-configs";
import React from "react";
import Switch from "@/ui/Switch";
import { useAppDispatch } from "@/store/hooks";
import { actions } from "@/store/scene/state/scene.slice";
import { visibilityMode } from "@/store/scene/state/util";
import { useFinalVisibility } from "@/store/scene/evaluation/mathScope";
import { useMathScope } from "@/store/scene/evaluation/useMathScope";

/**
 * Whether Calculated Visibility decides; turning it off keeps what's shown.
 * Name it with `aria-labelledby`.
 */
const FollowSwitch: React.FC<{ item: MathGraphic; labelId: string }> = ({
  item,
  labelId,
}) => {
  const dispatch = useAppDispatch();
  const shown = useFinalVisibility(useMathScope(), item);
  const mode = visibilityMode(item.properties);
  return (
    <Switch
      aria-labelledby={labelId}
      checked={mode === "following"}
      disabled={mode === "none"}
      onCheckedChange={(checked) => {
        dispatch(
          checked
            ? actions.followCalculatedVisibility({ ids: [item.id] })
            : actions.setProperties({
                id: item.id,
                type: item.type,
                properties: { visible: shown, useCalculatedVisibility: false },
              }),
        );
      }}
    />
  );
};

export default FollowSwitch;
