import React, { useEffect } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import * as Sentry from "@sentry/react";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { RENDERER_PREFERENCE_KEY } from "@/services/renderer/rendererPreference";
import { threeViewport } from "@/test_util/threeViewport";
import type { ThreeViewportProps } from "@/test_util/threeViewport";
import ThreeViewport from "./ThreeViewport";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureMessage: vi.fn(),
}));

const renderViewport = (url = "/") => {
  const store = getStore();
  const scene = new SceneBuilder();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <ThreeViewport />
      </MemoryRouter>
    </Provider>,
  );
};

test("the first drawn frame marks the viewport ready", async () => {
  const DrawsAFrame = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => hooks.onReady(), [hooks]);
    return null;
  };
  threeViewport.Component = DrawsAFrame;
  renderViewport();

  const scene = screen.getByTestId("scene");
  await waitFor(() =>
    // E2E waits on this attribute, which no accessible query reaches.
    // eslint-disable-next-line testing-library/no-node-access
    expect(scene.querySelector("[data-ready]")).not.toBeNull(),
  );
});

test("an unsupported browser gets a way back to the default renderer", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const noBackend = new Error("no backend");
  const Unsupported = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => hooks.onUnsupported(noBackend), [hooks]);
    return null;
  };
  threeViewport.Component = Unsupported;
  renderViewport();

  expect(
    await screen.findByText("The three.js renderer can't run in this browser."),
  ).toBeInTheDocument();
  expect(warn).toHaveBeenCalledWith(noBackend);
  expect(Sentry.captureMessage).toHaveBeenCalledExactlyOnceWith(
    "three.js unsupported: no backend",
    { level: "info" },
  );

  await user.click(
    screen.getByRole("button", { name: "Switch to the default renderer" }),
  );
  expect(localStorage.getItem(RENDERER_PREFERENCE_KEY)).toBe("mathbox");
});

test.each([
  { url: "/", transparency: undefined },
  { url: "/?oit=0", transparency: "ordered" },
  { url: "/?oit=1", transparency: "oit" },
])(
  "$url asks the renderer for transparency $transparency",
  async ({ url, transparency }) => {
    const Renderer = vi.fn((_props: ThreeViewportProps) => null);
    threeViewport.Component = Renderer;
    renderViewport(url);
    await waitFor(() =>
      expect(Renderer.mock.lastCall?.[0].transparency).toBe(transparency),
    );
    expect(Renderer).toHaveBeenCalled();
  },
);
