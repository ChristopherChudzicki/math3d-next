import type { AppStore } from "@/store/store";
import { sceneContentOf } from "@/store/scene/drafts/fingerprint";
import { writeDraft } from "@/store/scene/drafts/storage";

/**
 * Writes the draft the editor's writer would, without waiting out its
 * debounce. Returns the draft's id.
 */
const writeSessionDraft = (store: AppStore): string => {
  const { scene } = store.getState();
  writeDraft({
    id: scene.draftId,
    ...sceneContentOf(scene),
    key: scene.key,
    author: scene.author,
    baseModifiedDate: scene.modifiedDate,
    owner: null,
    updatedAt: Date.now(),
  });
  return scene.draftId;
};

export default writeSessionDraft;
