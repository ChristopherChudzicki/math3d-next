import { expect, test } from "vitest";
import { HttpResponse, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { act, renderTestApp, screen, user, waitFor } from "@/test_util";
import { getStore } from "@/store/store";
import { sceneSlice } from "@/features/sceneControls/mathItems";
import {
  SIGN_IN_DRAFT_KEY,
  saveSignInDraft,
} from "@/features/auth/signInDraft";

// A store holding `scene` with an unsaved title edit, as saved before sign-in.
const editedDraftOf = (scene: Scene) => {
  const store = getStore();
  store.dispatch(
    sceneSlice.actions.setScene({
      key: scene.key,
      author: null,
      items: scene.items,
      order: scene.itemOrder,
      title: scene.title ?? "",
      isLegacy: false,
    }),
  );
  store.dispatch(
    sceneSlice.actions.setTitle({ title: `${scene.title} (edited)` }),
  );
  return store.getState();
};

test("a draft saved on this scene wins over the fetched copy", async () => {
  const scene = seedDb.withSceneFromItems([]);
  saveSignInDraft(
    editedDraftOf(scene),
    `${window.location.origin}/${scene.key}`,
  );

  const { store, queryClient } = renderTestApp(`/${scene.key}`);

  await waitFor(() =>
    expect(
      queryClient.getQueryState(["scenes", "detail", scene.key])?.status,
    ).toBe("success"),
  );
  expect(store.getState().scene.title).toBe(`${scene.title} (edited)`);
  expect(store.getState().scene.dirty).toBe(true);
});

test("a draft saved before its page's scene loaded is not applied", async () => {
  // Signing in while the scene is still loading saves the empty store.
  const scene = seedDb.withSceneFromItems([]);
  saveSignInDraft(
    getStore().getState(),
    `${window.location.origin}/${scene.key}`,
  );

  const { store } = renderTestApp(`/${scene.key}`);

  await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
  expect(store.getState().scene.title).toBe(scene.title);
});

test("a draft saved on another scene is discarded, not applied", async () => {
  const here = seedDb.withSceneFromItems([]);
  const elsewhere = seedDb.withSceneFromItems([]);
  saveSignInDraft(
    editedDraftOf(elsewhere),
    `${window.location.origin}/${elsewhere.key}`,
  );

  const { store } = renderTestApp(`/${here.key}`);

  await waitFor(() => expect(store.getState().scene.key).toBe(here.key));
  expect(store.getState().scene.title).toBe(here.title);
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("a refetch of the open scene keeps unsaved edits", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { store, queryClient } = renderTestApp(`/${scene.key}`);
  const title = await screen.findByLabelText<HTMLInputElement>("Scene Title");
  await user.type(title, " (unsaved edit)");
  const edited = store.getState().scene.title;
  // A changed body, like the GET after a save: an unchanged one comes back as
  // the same object, which no loader would re-dispatch.
  server.use(
    http.get(urls.scenes.detail, () =>
      HttpResponse.json({ ...scene, modifiedDate: new Date().toISOString() }),
    ),
  );

  await act(() => queryClient.refetchQueries());
  // React Query notifies its observers on a later tick.
  await act(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve);
      }),
  );

  expect(store.getState().scene.title).toBe(edited);
});
