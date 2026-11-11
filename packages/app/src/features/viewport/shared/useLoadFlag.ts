import { useCallback, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import * as select from "@/store/scene/state/selectors";

/**
 * A flag that holds for the current scene load only, and its setter. A setter
 * from a load that has since been replaced does nothing.
 */
export const useLoadFlag = () => {
  const loadCount = useAppSelector(select.loadCount);
  const [flagged, setFlagged] = useState<number | null>(null);
  const set = useCallback(
    () =>
      setFlagged((last) =>
        last !== null && last > loadCount ? last : loadCount,
      ),
    [loadCount],
  );
  return [flagged === loadCount, set] as const;
};
