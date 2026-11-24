import { useEffect } from "react";
import { debounce } from "lodash-es";
import { useAppStore } from "@/store/hooks";
import type { SceneState } from "@/store/scene/state/interfaces";
import { sceneFingerprint } from "@/store/scene/drafts/fingerprint";
import {
  readDraft,
  removeDraft,
  writeDraft,
} from "@/store/scene/drafts/storage";

const DEBOUNCE_MS = 1000;

const contentOf = (scene: SceneState) => ({
  title: scene.title,
  items: Object.values(scene.items),
  itemOrder: scene.order,
});

/**
 * Writes the session's draft. A session has a draft once its record exists;
 * before that, only a change from the baseline starts one.
 */
const writeFor = (scene: SceneState) => {
  if (!scene.loaded) return;
  const existing = readDraft(scene.draftId);
  const content = contentOf(scene);
  if (!existing && sceneFingerprint(content) === scene.baseline) return;
  const now = Date.now();
  writeDraft({
    id: scene.draftId,
    ...content,
    key: scene.key,
    author: scene.author,
    baseModifiedDate: scene.modifiedDate,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  });
};

/** Keeps the editor's unsaved work in a draft (`store/scene/drafts`). */
const useDraftWriter = () => {
  const store = useAppStore();
  useEffect(() => {
    let prev = store.getState().scene;
    // Each call holds its scene, so a pending write keeps its session's id.
    const write = debounce(writeFor, DEBOUNCE_MS);

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
        if (sceneFingerprint(contentOf(next)) === next.baseline) {
          removeDraft(next.draftId);
        } else {
          writeFor(next);
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
