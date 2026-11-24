import { useEffect, useSyncExternalStore } from "react";
import { listDrafts, pruneDrafts, subscribeDrafts } from "./storage";
import type { DraftRecord } from "./storage";

// useSyncExternalStore needs a stable snapshot between changes. The cache is
// only trusted while someone is subscribed to hear what invalidates it.
let cached: DraftRecord[] | null = null;
let subscribers = 0;
const getSnapshot = () => {
  cached ??= listDrafts();
  return cached;
};
const subscribe = (onChange: () => void) => {
  subscribers += 1;
  const unsubscribe = subscribeDrafts(() => {
    cached = null;
    onChange();
  });
  return () => {
    unsubscribe();
    subscribers -= 1;
    if (subscribers === 0) cached = null;
  };
};

/** Unexpired drafts in this browser, newest first; live across tabs. */
const useDrafts = (): DraftRecord[] => {
  // Pruning writes storage, so it runs here rather than in the render read.
  useEffect(() => pruneDrafts(), []);
  return useSyncExternalStore(subscribe, getSnapshot);
};

export default useDrafts;
