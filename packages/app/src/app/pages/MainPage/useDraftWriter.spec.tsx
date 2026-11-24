import React from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { Provider } from "react-redux";
import { act, renderHook } from "@testing-library/react";
import invariant from "tiny-invariant";
import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import type { AppStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import * as select from "@/store/scene/state/selectors";
import { storeWithScene } from "@/test_util/storeWithScene";
import {
  listDrafts,
  readDraft,
  writeDraft,
} from "@/store/scene/drafts/storage";
import useDraftWriter, { DEBOUNCE_MS } from "./useDraftWriter";

const POINT = "point";
const SLIDER = "slider";
const CAMERA = "camera";

const loadScene = () => {
  const scene = new SceneBuilder();
  scene
    .folder()
    .item(MIT.Point, {}, POINT)
    .item(MIT.VariableSlider, {}, SLIDER);
  return scene;
};

const mountWriter = (store: AppStore) =>
  renderHook(() => useDraftWriter(), {
    wrapper: ({ children }) => <Provider store={store}>{children}</Provider>,
  });

const editExpression = (store: AppStore, coords: string) =>
  act(() => {
    store.dispatch(
      actions.setProperties({
        id: POINT,
        type: MIT.Point,
        properties: { coords },
      }),
    );
  });

const advance = (ms = DEBOUNCE_MS) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const markSavedNow = (
  store: AppStore,
  sent: ReturnType<typeof select.sceneInfo>,
  sentAt: { revision: number; loadCount: number },
) =>
  act(() => {
    store.dispatch(
      actions.markSaved({
        key: "saved-key",
        author: 1,
        ...sentAt,
        snapshot: sent,
        modifiedDate: "2026-11-20T12:00:00.000Z",
      }),
    );
  });

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

test("camera moves and slider drags make no draft", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);

  act(() => {
    store.dispatch(
      actions.patchProperty({
        id: CAMERA,
        path: "/position",
        value: "[1,2,3]",
      }),
    );
    store.dispatch(
      actions.setProperties({
        id: SLIDER,
        type: MIT.VariableSlider,
        properties: { value: { lhs: "T", rhs: "2", type: "assignment" } },
      }),
    );
  });
  advance();

  expect(listDrafts()).toEqual([]);
});

test("an edit is written once the debounce settles, and later edits update the same draft", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  const { draftId } = store.getState().scene;

  editExpression(store, "[1,1,1]");
  advance(DEBOUNCE_MS - 1);
  expect(listDrafts()).toEqual([]);
  advance(1);
  expect(readDraft(draftId)?.items).toContainEqual(
    expect.objectContaining({
      id: POINT,
      properties: expect.objectContaining({ coords: "[1,1,1]" }),
    }),
  );

  editExpression(store, "[2,2,2]");
  advance();
  expect(listDrafts()).toHaveLength(1);
  expect(readDraft(draftId)?.items).toContainEqual(
    expect.objectContaining({
      properties: expect.objectContaining({ coords: "[2,2,2]" }),
    }),
  );
});

test("undoing an edit by hand keeps the draft", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  const original = store.getState().scene.items[POINT].properties;

  editExpression(store, "[1,1,1]");
  advance();
  invariant("coords" in original);
  editExpression(store, original.coords);
  advance();

  expect(readDraft(store.getState().scene.draftId)).not.toBeNull();
});

test("loading another scene mid-debounce records the edit under the old session's id", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  const { draftId: oldId } = store.getState().scene;

  editExpression(store, "[1,1,1]");
  const other = loadScene();
  act(() => {
    store.dispatch(actions.setScene({ ...other, order: other.itemOrder }));
  });
  advance();

  const { draftId: newId } = store.getState().scene;
  expect(newId).not.toBe(oldId);
  expect(readDraft(oldId)).not.toBeNull();
  expect(readDraft(newId)).toBeNull();
});

test("opening a draft mid-debounce leaves the opened draft's record alone", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  const { draftId: oldId } = store.getState().scene;
  const source = loadScene();
  const opened = {
    id: "opened",
    title: "Opened",
    items: source.items,
    itemOrder: source.itemOrder,
    key: null,
    author: null,
    baseModifiedDate: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  writeDraft(opened);

  editExpression(store, "[1,1,1]");
  act(() => {
    store.dispatch(
      actions.setScene({
        ...opened,
        order: opened.itemOrder,
        isLegacy: false,
        draftId: opened.id,
        dirty: true,
      }),
    );
  });
  advance();

  expect(readDraft(oldId)).not.toBeNull();
  expect(readDraft("opened")?.updatedAt).toBe(opened.updatedAt);
});

test("a save with no edits during it removes the draft", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  editExpression(store, "[1,1,1]");
  advance();
  const { revision, loadCount, draftId } = store.getState().scene;

  markSavedNow(store, select.sceneInfo(store.getState()), {
    revision,
    loadCount,
  });

  expect(readDraft(draftId)).toBeNull();
});

test("a save with edits during it keeps the draft, under the saved key", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  editExpression(store, "[1,1,1]");
  advance();
  const { revision, loadCount, draftId } = store.getState().scene;
  const sent = select.sceneInfo(store.getState());

  editExpression(store, "[2,2,2]");
  markSavedNow(store, sent, { revision, loadCount });

  expect(readDraft(draftId)?.key).toBe("saved-key");
});

test("hiding the tab writes a pending edit at once", () => {
  const store = storeWithScene(loadScene());
  mountWriter(store);
  editExpression(store, "[1,1,1]");

  vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
  act(() => {
    document.dispatchEvent(new Event("visibilitychange"));
  });

  expect(readDraft(store.getState().scene.draftId)).not.toBeNull();
  vi.restoreAllMocks();
});

test("a store restored after sign-in continues the same draft", () => {
  const first = storeWithScene(loadScene());
  const view = mountWriter(first);
  editExpression(first, "[1,1,1]");
  advance();
  view.unmount();

  const restored = getStore({ preloadedState: first.getState() });
  mountWriter(restored);
  editExpression(restored, "[2,2,2]");
  advance();

  expect(listDrafts()).toHaveLength(1);
  expect(listDrafts()[0].id).toBe(first.getState().scene.draftId);
});
