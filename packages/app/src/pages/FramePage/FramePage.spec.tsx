import { test, expect } from "vitest";
import { SceneBuilder, seedDb } from "@math3d/mock-api";
import { renderTestApp, screen, waitFor, waitForAppReady } from "@/test_util";
import { select } from "@/features/sceneControls/mathItems/sceneSlice";

const REQUIRED_ITEMS = ["axis-x", "axis-y", "axis-z", "camera"];

test("renders the scene with its data loaded and no editor chrome", async () => {
  const scene = new SceneBuilder();
  seedDb.withScene(scene.json());

  const { store } = renderTestApp(`/app/frame/${scene.key}`);

  // Scene data loads into Redux even though SceneControls is never mounted.
  await waitFor(() =>
    expect(select.hasItems(REQUIRED_ITEMS)(store.getState())).toBe(true),
  );

  // The 3D scene container is present...
  expect(screen.getByTestId("scene")).toBeInTheDocument();

  // ...but none of the editor chrome is.
  expect(
    screen.queryByRole("button", { name: "Collapse Controls" }),
  ).toBeNull();
  expect(screen.queryByRole("button", { name: "Expand Controls" })).toBeNull();
  expect(screen.queryByTestId("toggle-keyboard-button")).toBeNull();
});

test("a missing scene neither alerts nor redirects (silent 404)", async () => {
  const { location, queryClient } = renderTestApp("/app/frame/does-not-exist");

  await waitForAppReady(queryClient);

  expect(screen.queryByRole("dialog")).toBeNull();
  expect(location.current.pathname).toBe("/app/frame/does-not-exist");
});
