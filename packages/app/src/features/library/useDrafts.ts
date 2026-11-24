import { useEffect, useState } from "react";
import {
  listDrafts,
  pruneDrafts,
  subscribeDrafts,
} from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";

/** Unexpired drafts in this browser, newest first; live across tabs. */
const useDrafts = (): DraftRecord[] => {
  const [drafts, setDrafts] = useState(listDrafts);
  useEffect(() => {
    const unsubscribe = subscribeDrafts(() => setDrafts(listDrafts()));
    // Pruning writes storage, so it runs here rather than in the render read.
    pruneDrafts();
    setDrafts(listDrafts());
    return unsubscribe;
  }, []);
  return drafts;
};

export default useDrafts;
