import { test, expect } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { SceneBuilder, makeItem, seedDb } from "@math3d/mock-api";
import {
  renderTestApp,
  screen,
  userWaits,
  waitFor,
  waitForAppReady,
} from "@/test_util";
import * as select from "@/store/scene/state/selectors";
import { mathScopeId } from "@/store/scene/evaluation/mathScope";

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];

test("renders the scene with its data loaded and no editor UI", async () => {
  const scene = new SceneBuilder();
  seedDb.withScene(scene.json());

  const { store } = renderTestApp(`/app/frame/${scene.key}`);

  // Scene data loads into Redux even though SceneControls is never mounted.
  await waitFor(() =>
    expect(select.hasItems(REQUIRED_ITEMS)(store.getState())).toBe(true),
  );

  // The 3D scene container is present...
  expect(screen.getByTestId("scene")).toBeInTheDocument();

  // ...but none of the editor UI is.
  expect(
    screen.queryByRole("button", { name: "Collapse Controls" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Expand Controls" })).toBeNull();
  expect(screen.queryByTestId("toggle-keyboard-button")).toBeNull();
});

test("does not animate a slider saved mid-animation", async () => {
  const item = makeItem(MIT.VariableSlider, { isAnimating: "true" });
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = renderTestApp(`/app/frame/${scene.key}`);
  const getValue = () =>
    store.mathScope.get().results.get(mathScopeId(item.id, "value"));
  await waitFor(() => expect(getValue()).toEqual(expect.any(Number)));
  const saved = getValue();

  await userWaits(200);

  expect(getValue()).toBe(saved);
});

test("a missing scene neither alerts nor redirects (silent 404)", async () => {
  const { location, queryClient } = renderTestApp("/app/frame/does-not-exist");

  await waitForAppReady(queryClient);

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(location.current.pathname).toBe("/app/frame/does-not-exist");
});
