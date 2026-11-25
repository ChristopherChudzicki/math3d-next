import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { isApiError, sceneQueryOptions } from "@math3d/api";
import { useAppDispatch } from "@/store/hooks";
import sceneSlice from "@/store/scene/state/scene.slice";
import { removeDraft, writeDraft } from "@/store/scene/drafts/storage";
import type { DraftRecord } from "@/store/scene/drafts/storage";
import { showToast } from "@/ui/Toast/toasts";
import { ListType, sceneHref } from "./constants";

const UNOPENABLE_TOAST =
  "This unsaved work couldn’t be opened, so it was removed.";

/**
 * Opens a draft in the editor as unsaved work, under a fresh draft id, at its
 * scene's URL with the Unsaved tab still open. A draft that can't be loaded is
 * removed, and the editor keeps what it had.
 */
const useOpenDraft = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const queryClient = useQueryClient();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const opening = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const discard = (record: DraftRecord) => {
    removeDraft(record.id);
    showToast(UNOPENABLE_TOAST);
  };

  /** Whether the draft's scene still exists, is legacy, and was saved since. */
  const checkBase = async (
    key: string,
    baseModifiedDate: string | null,
  ): Promise<{ exists: boolean; isLegacy: boolean; savedSince: boolean }> => {
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
        isLegacy: scene.isLegacy ?? false,
        savedSince:
          baseModifiedDate !== null &&
          Date.parse(scene.modifiedDate) > Date.parse(baseModifiedDate),
      };
    } catch (error) {
      // Any other failure (offline, say) opens the draft as it stands.
      return {
        exists: !isApiError(error, [404]),
        isLegacy: false,
        savedSince: false,
      };
    }
  };

  /** The new draft id, or null if the draft wasn't opened. */
  const open = async (record: DraftRecord): Promise<string | null> => {
    const base = record.key
      ? await checkBase(record.key, record.baseModifiedDate)
      : { exists: false, isLegacy: false, savedSince: false };
    // The user closed the list while the fetch ran.
    if (!mounted.current) return null;
    // A draft of a deleted scene opens as a new scene, so Save creates one.
    const key = base.exists ? record.key : null;
    const author = key ? record.author : null;
    const baseModifiedDate = key ? record.baseModifiedDate : null;

    const load = sceneSlice.actions.setScene({
      items: record.items,
      order: record.itemOrder,
      title: record.title,
      key,
      author,
      isLegacy: base.isLegacy,
      modifiedDate: baseModifiedDate,
      dirty: true,
      savedSince: base.savedSince,
    });
    try {
      // Listed drafts are checked when read, so only a reducer that throws
      // ends up here. That leaves the store as it was.
      dispatch(load);
    } catch {
      discard(record);
      return null;
    }
    // Removed first, so the copy reuses its slot and its bytes. It keeps its
    // `updatedAt`, so rows don't reorder as the user clicks through them.
    removeDraft(record.id);
    writeDraft({
      ...record,
      id: load.payload.draftId,
      key,
      author,
      baseModifiedDate,
    });
    if (pathname !== `/${key ?? ""}`) {
      navigate(sceneHref(key ?? "", ListType.Unsaved));
    }
    return load.payload.draftId;
  };

  const openDraft = async (record: DraftRecord): Promise<string | null> => {
    // A second click while the first fetches would open it again, leaving two
    // copies.
    if (opening.current) return null;
    opening.current = true;
    setOpeningId(record.id);
    try {
      return await open(record);
    } finally {
      opening.current = false;
      if (mounted.current) setOpeningId(null);
    }
  };

  return { openDraft, openingId };
};

export default useOpenDraft;
