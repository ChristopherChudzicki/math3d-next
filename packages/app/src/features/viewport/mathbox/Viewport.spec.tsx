import React from "react";
import { screen } from "@testing-library/react";
import { Provider } from "react-redux";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { RENDERER_PREFERENCE_KEY } from "@/services/renderer/rendererPreference";
import { renderWithRouter } from "@/test_util/routerTesting";
import Viewport from "./Viewport";

vi.mock("mathbox-react", async () => ({
  ...(await vi.importActual<object>("@/__mocks__/mathbox-react")),
  Mathbox: () => {
    throw new Error("no WebGL");
  },
}));

test("a MathBox that throws offers the default renderer", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  const store = getStore();
  const scene = new SceneBuilder();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  await renderWithRouter(
    <Provider store={store}>
      <Viewport />
    </Provider>,
  );

  const button = await screen.findByRole("button", {
    name: "Switch to the default renderer",
  });
  expect(screen.getByTestId("scene")).toHaveAttribute(
    "data-scene-error",
    "error",
  );
  await user.click(button);
  expect(localStorage.getItem(RENDERER_PREFERENCE_KEY)).toBe("threejs");
});
