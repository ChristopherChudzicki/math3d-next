import { expect, test } from "vitest";
import { seedDb } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { act, renderTestApp, screen, user, waitFor } from "@/test_util";
import { getStore } from "@/store/store";
import { sceneSlice } from "@/features/sceneControls/mathItems";
import { saveSignInDraft } from "@/features/auth/signInDraft";

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
  saveSignInDraft(editedDraftOf(scene), `/${scene.key}`);

  const { store } = renderTestApp(`/${scene.key}`);

  await waitFor(() =>
    expect(store.getState().scene.title).toBe(`${scene.title} (edited)`),
  );
  expect(store.getState().scene.dirty).toBe(true);
});

test("a draft saved on another scene is not applied here", async () => {
  const here = seedDb.withSceneFromItems([]);
  const elsewhere = seedDb.withSceneFromItems([]);
  saveSignInDraft(editedDraftOf(elsewhere), `/${elsewhere.key}`);

  const { store } = renderTestApp(`/${here.key}`);

  await waitFor(() => expect(store.getState().scene.key).toBe(here.key));
  expect(store.getState().scene.title).toBe(here.title);
});

test("a draft is not restored by navigating to its scene within the app", async () => {
  const here = seedDb.withSceneFromItems([]);
  const elsewhere = seedDb.withSceneFromItems([]);
  saveSignInDraft(editedDraftOf(elsewhere), `/${elsewhere.key}`);
  const { store, router } = renderTestApp(`/${here.key}`);
  await waitFor(() => expect(store.getState().scene.key).toBe(here.key));

  await act(() => router.navigate(`/${elsewhere.key}`));

  await waitFor(() => expect(store.getState().scene.key).toBe(elsewhere.key));
  expect(store.getState().scene.title).toBe(elsewhere.title);
});

test("a refetch of the open scene keeps unsaved edits", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { queryClient } = renderTestApp(`/${scene.key}`);
  const title = await screen.findByLabelText<HTMLInputElement>("Scene Title");
  await user.type(title, " (unsaved edit)");
  const edited = title.value;

  await act(() => queryClient.refetchQueries());

  expect(title).toHaveValue(edited);
});
