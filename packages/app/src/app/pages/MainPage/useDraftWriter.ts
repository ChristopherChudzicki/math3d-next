import { useEffect, useRef } from "react";
import { debounce } from "lodash-es";
import { useAppStore } from "@/store/hooks";
import type { SceneState } from "@/store/scene/state/interfaces";
import {
  sceneContentOf,
  sceneFingerprint,
} from "@/store/scene/drafts/fingerprint";
import {
  readDraft,
  removeDraft,
  writeDraft,
} from "@/store/scene/drafts/storage";

const DEBOUNCE_MS = 1000;

/** Who is signed in: a user id, null for nobody, undefined while unknown. */
type Owner = number | null | undefined;

/**
 * Writes the session's draft. A session has a draft once its record exists;
 * before that, only a change from the baseline starts one.
 */
const writeFor = (scene: SceneState, owner: Owner) => {
  if (!scene.loaded) return;
  const existing = readDraft(scene.draftId);
  const content = sceneContentOf(scene);
  if (!existing && sceneFingerprint(content) === scene.baseline) return;
  writeDraft({
    id: scene.draftId,
    ...content,
    key: scene.key,
    author: scene.author,
    baseModifiedDate: scene.modifiedDate,
    owner: owner === undefined ? existing?.owner ?? null : owner,
    updatedAt: Date.now(),
  });
};

/** Keeps the editor's unsaved work in a draft (`store/scene/drafts`). */
const useDraftWriter = (owner: Owner) => {
  const store = useAppStore();
  const ownerRef = useRef(owner);
  ownerRef.current = owner;
  useEffect(() => {
    let prev = store.getState().scene;
    // Each call holds its scene, so a pending write keeps its session's id.
    const write = debounce(
      (scene: SceneState) => writeFor(scene, ownerRef.current),
      DEBOUNCE_MS,
    );

    const unsubscribe = store.subscribe(() => {
      const next = store.getState().scene;
      if (next === prev) return;
      const before = prev;
      prev = next;
      if (next.loadCount !== before.loadCount) {
        write.flush();
      } else if (next.saveCount !== before.saveCount) {
        // The draft is done unless edits arrived while the save was sent.
        write.cancel();
        if (sceneFingerprint(sceneContentOf(next)) === next.baseline) {
          removeDraft(next.draftId);
        } else {
          writeFor(next, ownerRef.current);
        }
      } else if (next.revision !== before.revision) {
        write(next);
      }
    });
    const flush = () => write.flush();
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    return () => {
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [store]);
};

export default useDraftWriter;
export { DEBOUNCE_MS };
