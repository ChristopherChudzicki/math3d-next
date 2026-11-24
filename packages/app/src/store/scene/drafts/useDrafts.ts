import { useEffect, useSyncExternalStore } from "react";
import { listDrafts, pruneDrafts, subscribeDrafts } from "./storage";
import type { DraftRecord } from "./storage";

// useSyncExternalStore needs a stable snapshot between changes.
let cached: DraftRecord[] | null = null;
const getSnapshot = () => {
  cached ??= listDrafts();
  return cached;
};
const subscribe = (onChange: () => void) =>
  subscribeDrafts(() => {
    cached = null;
    onChange();
  });

/** Unexpired drafts in this browser, newest first; live across tabs. */
const useDrafts = (): DraftRecord[] => {
  // Pruning writes storage, so it runs here rather than in the render read.
  useEffect(() => pruneDrafts(), []);
  return useSyncExternalStore(subscribe, getSnapshot);
};

export default useDrafts;
