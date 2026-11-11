import { useCallback, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";

/**
 * Whether the renderer has called `ViewportHooks.onReady` for the current
 * scene load, and the `onReady` to pass it.
 */
export const useSceneReady = () => {
  const loadCount = useAppSelector(select.loadCount);
  const [readyLoad, setReadyLoad] = useState<number | null>(null);
  const onReady = useCallback(() => setReadyLoad(loadCount), [loadCount]);
  return [readyLoad === loadCount, onReady] as const;
};
