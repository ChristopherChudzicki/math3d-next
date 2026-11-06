import React, { useEffect } from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import * as Sentry from "@sentry/react";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { RENDERER_SETTING_ID } from "@/services/renderer";
import { RENDERER_PREFERENCE_KEY } from "@/services/renderer/rendererPreference";
import { stubWebGpu } from "@/test_util";
import { gpuContent } from "@/test_util/gpuViewportContent";
import type { ContentProps } from "@/test_util/gpuViewportContent";
import GpuViewport from "./GpuViewport";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureMessage: vi.fn(),
}));

const noAdapter = new Error("no adapter");
const ReportsUnsupportedTwice = ({ onUnsupported }: ContentProps) => {
  useEffect(() => {
    onUnsupported(noAdapter);
    onUnsupported(noAdapter);
  }, [onUnsupported]);
  return null;
};
const FailsToLoad = (): null => {
  throw new Error("Failed to fetch dynamically imported module");
};

const loadScene = (store: ReturnType<typeof getStore>) => {
  const scene = new SceneBuilder();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
};

const renderViewport = () => {
  const store = getStore();
  loadScene(store);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/abc"]}>
        <button type="button" id={RENDERER_SETTING_ID}>
          Account menu
        </button>
        <GpuViewport />
      </MemoryRouter>
    </Provider>,
  );
  return { store };
};

test("with 3D disabled it renders the empty scene container", () => {
  localStorage.setItem("disable3dScene", "true");
  renderViewport();
  expect(screen.getByTestId("scene")).toBeEmptyDOMElement();
});

test("when the renderer reports WebGPU unsupported it reports once", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  stubWebGpu();
  gpuContent.Component = ReportsUnsupportedTwice;
  renderViewport();
  await waitFor(() => expect(warn).toHaveBeenCalledWith(noAdapter));
  expect(Sentry.captureMessage).toHaveBeenCalledOnce();
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    "WebGPU unsupported: no adapter",
    { level: "info" },
  );
  expect(warn).toHaveBeenCalledOnce();
});

test("when the renderer throws, its button switches to the default renderer", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  stubWebGpu();
  gpuContent.Component = FailsToLoad;
  const { store } = renderViewport();
  expect(
    await screen.findByText("The WebGPU renderer ran into an error."),
  ).toBeInTheDocument();

  await user.click(
    screen.getByRole("button", { name: "Switch to the default renderer" }),
  );
  expect(localStorage.getItem(RENDERER_PREFERENCE_KEY)).toBe("mathbox");
  expect(screen.getByRole("button", { name: "Account menu" })).toHaveFocus();

  gpuContent.Component = gpuContent.RendersNothing;
  act(() => loadScene(store));
  expect(screen.queryByText(/ran into an error/)).not.toBeInTheDocument();
});
