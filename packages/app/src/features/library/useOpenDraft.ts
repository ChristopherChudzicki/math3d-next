import { useRef } from "react";
import { nanoid } from "@reduxjs/toolkit";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { isApiError, sceneQueryOptions } from "@math3d/api";
import { useAppDispatch } from "@/store/hooks";
import sceneSlice from "@/store/scene/state/scene.slice";
import { isRestorableDraft } from "@/store/scene/drafts/restorable";
import { removeDraft, writeDraft } from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";
import { showToast } from "@/ui/Toast/toasts";

const UNOPENABLE_TOAST =
  "This unsaved work couldn’t be opened, so it was removed.";

/**
 * Opens a draft in the editor as unsaved work, under a fresh draft id, then
 * navigates to its scene's URL, which closes the overlay. A draft that can't
 * be loaded is removed, and the editor keeps what it had.
 */
const useOpenDraft = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const opening = useRef(false);

  const discard = (record: DraftRecord) => {
    removeDraft(record.id);
    showToast(UNOPENABLE_TOAST);
  };

  /** Whether the draft's scene still exists, and was saved since the draft. */
  const checkBase = async (
    key: string,
    baseModifiedDate: string | null,
  ): Promise<{ exists: boolean; savedSince: boolean }> => {
    try {
      // The loader's cache never goes stale, so fetch fresh; that also hands
      // the loader the current scene. Opening shouldn't wait out retries, or
      // pause while offline.
      const scene = await queryClient.fetchQuery({
        ...sceneQueryOptions(key),
        staleTime: 0,
        retry: false,
        networkMode: "always",
      });
      return {
        exists: true,
        savedSince:
          baseModifiedDate !== null &&
          Date.parse(scene.modifiedDate) > Date.parse(baseModifiedDate),
      };
    } catch (error) {
      // Any other failure (offline, say) opens the draft as it stands.
      return { exists: !isApiError(error, [404]), savedSince: false };
    }
  };

  const open = async (record: DraftRecord) => {
    if (!isRestorableDraft(record)) {
      discard(record);
      return;
    }
    const base = record.key
      ? await checkBase(record.key, record.baseModifiedDate)
      : { exists: false, savedSince: false };
    // A draft of a deleted scene opens as a new scene, so Save creates one.
    const key = base.exists ? record.key : null;
    const author = key ? record.author : null;
    const baseModifiedDate = key ? record.baseModifiedDate : null;

    const draftId = nanoid();
    const load = sceneSlice.actions.setScene({
      items: record.items,
      order: record.itemOrder,
      title: record.title,
      key,
      author,
      isLegacy: false,
      modifiedDate: baseModifiedDate,
      draftId,
      dirty: true,
      savedSince: base.savedSince,
    });
    try {
      sceneSlice.reducer(undefined, load);
    } catch {
      discard(record);
      return;
    }

    writeDraft({ ...record, id: draftId, key, author, baseModifiedDate });
    removeDraft(record.id);
    dispatch(load);
    navigate(`/${key ?? ""}`);
  };

  return async (record: DraftRecord) => {
    // A second click while the first fetches would fork the draft twice.
    if (opening.current) return;
    opening.current = true;
    try {
      await open(record);
    } finally {
      opening.current = false;
    }
  };
};

export default useOpenDraft;
