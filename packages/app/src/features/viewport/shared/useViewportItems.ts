import { useMemo } from "react";
import { isMathGraphic, MathItemType } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";
import useAxesInfo from "./useAxesInfo";

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];

/** Whether the scene holds the items a viewport needs: three axes and a camera. */
const useHasViewportItems = () =>
  useAppSelector(select.hasItems(REQUIRED_ITEMS));

/** What a viewport draws: the graphics in order, the camera, and the axes' extent. */
const useViewportItems = () => {
  const items = useAppSelector(select.stableOrderedMathItems);
  const camera = useAppSelector(select.mathItem("camera"));
  invariant(camera.type === MathItemType.Camera);
  const { scale, range } = useAxesInfo();
  const graphics = useMemo(() => items.filter(isMathGraphic), [items]);
  return { graphics, camera, range, scale };
};

export { useViewportItems, useHasViewportItems };
