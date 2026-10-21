import { expect, test } from "vitest";
import { HttpResponse, http } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import type { Scene } from "@math3d/api";
import { focusManager } from "@tanstack/react-query";
import { act, renameScene, renderTestApp, screen, waitFor } from "@/test_util";
import { createQueryClient } from "@/services/react-query/react-query";
import { getStore } from "@/store/store";
import sceneSlice from "@/store/scene/state/scene.slice";
import {
  SIGN_IN_DRAFT_KEY,
  saveSignInDraft,
} from "@/services/auth/signInDraft";

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
  const edited = `${scene.title} (unsaved edit)`;
  await renameScene(edited);
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

test("a failed refetch of the open scene keeps the editor", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { store, queryClient } = renderTestApp(`/${scene.key}`);
  await waitFor(() => expect(store.getState().scene.key).toBe(scene.key));
  server.use(
    http.get(urls.scenes.detail, () => new HttpResponse(null, { status: 500 })),
  );

  await act(() => queryClient.refetchQueries());

  expect(
    screen.getByRole("tablist", { name: "Scene controls" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("marking the open scene saved under a new key does not reload the route's scene", async () => {
  const { store } = renderTestApp("/");
  await waitFor(() => expect(store.getState().scene.loaded).toBe(true));

  act(() => {
    store.dispatch(sceneSlice.actions.setTitle({ title: "edited" }));
  });
  act(() => {
    store.dispatch(
      sceneSlice.actions.markSaved({
        key: "new-key",
        author: null,
        revision: store.getState().scene.revision,
        loadCount: store.getState().scene.loadCount,
      }),
    );
  });
  // The route still names "/", whose default scene would replace the edit.
  await act(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve);
      }),
  );

  expect(store.getState().scene.title).toBe("edited");
});

test("publishing over a route whose GET fails never shows the card", async () => {
  const { store, router } = renderTestApp("/");
  await waitFor(() => expect(store.getState().scene.loaded).toBe(true));
  server.use(
    http.get(urls.scenes.detail, () => new HttpResponse(null, { status: 500 })),
  );

  // PublishDialog marks the scene saved, then navigates to its new key.
  act(() => {
    store.dispatch(
      sceneSlice.actions.markSaved({
        key: "new-key",
        author: null,
        revision: store.getState().scene.revision,
        loadCount: store.getState().scene.loadCount,
      }),
    );
  });
  await act(() => router.navigate("/new-key"));
  await waitFor(() => expect(router.state.location.pathname).toBe("/new-key"));
  await act(
    () =>
      new Promise((resolve) => {
        setTimeout(resolve);
      }),
  );

  expect(
    screen.getByRole("tablist", { name: "Scene controls" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a restored sign-in draft whose GET fails shows the draft", async () => {
  const scene = seedDb.withSceneFromItems([]);
  saveSignInDraft(
    editedDraftOf(scene),
    `${window.location.origin}/${scene.key}`,
  );
  server.use(
    http.get(urls.scenes.detail, () => new HttpResponse(null, { status: 500 })),
  );

  const { store, queryClient } = renderTestApp(`/${scene.key}`);

  await waitFor(() =>
    expect(
      queryClient.getQueryState(["scenes", "detail", scene.key])?.status,
    ).toBe("error"),
  );
  expect(store.getState().scene.title).toBe(`${scene.title} (edited)`);
  expect(
    screen.getByRole("tablist", { name: "Scene controls" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).toBeNull();
});

test("a paused fetch in a background tab while online isn't offline", async () => {
  const scene = seedDb.withSceneFromItems([]);
  server.use(http.get(urls.scenes.detail, () => HttpResponse.error()));
  focusManager.setFocused(false);
  try {
    const { queryClient, router } = renderTestApp("/");
    // Production retries; a retry waits for focus, so the fetch pauses.
    const { retry } = createQueryClient().getDefaultOptions().queries ?? {};
    queryClient.setDefaultOptions({
      queries: {
        ...queryClient.getDefaultOptions().queries,
        retry,
        retryDelay: 0,
      },
    });
    await act(() => router.navigate(`/${scene.key}`));
    await waitFor(() =>
      expect(
        queryClient.getQueryState(["scenes", "detail", scene.key])?.fetchStatus,
      ).toBe("paused"),
    );

    expect(screen.queryByText(/You’re offline/)).toBeNull();
  } finally {
    focusManager.setFocused(undefined);
  }
});
