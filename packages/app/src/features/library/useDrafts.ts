import { useEffect, useState } from "react";
import {
  listDrafts,
  pruneDrafts,
  subscribeDrafts,
} from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";
import { useUserId } from "@/services/auth/useUserId";

/**
 * The drafts this browser shows the current user, newest first, live across
 * tabs: those written while signed out, and the user's own. Empty until
 * sign-in status is known, so no other user's draft shows for a moment.
 */
const useDrafts = (): DraftRecord[] => {
  const userId = useUserId();
  const [drafts, setDrafts] = useState(listDrafts);
  useEffect(() => {
    const unsubscribe = subscribeDrafts(() => setDrafts(listDrafts()));
    // Pruning writes storage, so it runs here rather than in the render read.
    pruneDrafts();
    setDrafts(listDrafts());
    return unsubscribe;
  }, []);
  if (userId === undefined) return [];
  return drafts.filter(
    (draft) => draft.owner === null || draft.owner === userId,
  );
};

export default useDrafts;
