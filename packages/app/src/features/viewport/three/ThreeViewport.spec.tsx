import React, { useEffect } from "react";
import { onTestFinished } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import type { ViewportHooks } from "@math3d/viewport-spec";
import * as Sentry from "@sentry/react";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { RENDERER_PREFERENCE_KEY } from "@/services/renderer/rendererPreference";
import { threeViewport } from "@/test_util/threeViewport";
import { stubKnotLoaderSupport } from "@/test_util/knotLoaderSupport";
import type { ThreeViewportProps } from "@/test_util/threeViewport";
import ThreeViewport from "./ThreeViewport";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureMessage: vi.fn(),
}));

const loadScene = (store: ReturnType<typeof getStore>) => {
  const scene = new SceneBuilder();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
};

const renderViewport = (url = "/") => {
  const store = getStore();
  loadScene(store);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[url]}>
        <ThreeViewport />
      </MemoryRouter>
    </Provider>,
  );
  return { store };
};

test("ready holds only for the scene load whose renderer settled", async () => {
  const mounted: ViewportHooks[] = [];
  const Records = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => {
      mounted.push(hooks);
    }, [hooks]);
    return null;
  };
  threeViewport.Component = Records;
  const { store } = renderViewport();
  const scene = screen.getByTestId("scene");
  await waitFor(() => expect(mounted).toHaveLength(1));
  const [first] = mounted;

  act(() => first.onReady());
  expect(scene).toHaveAttribute("data-scene-ready", "true");

  act(() => loadScene(store));
  expect(scene).not.toHaveAttribute("data-scene-ready");
  await waitFor(() => expect(mounted.at(-1)).not.toBe(first));

  act(() => mounted.at(-1)?.onReady());
  // The first load's renderer settling late changes nothing.
  act(() => first.onReady());
  expect(scene).toHaveAttribute("data-scene-ready", "true");
});

test("shows the loading knot until the first draw, then closes it and stops its worker", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { posted, terminate } = stubKnotLoaderSupport();
  const mounted: ViewportHooks[] = [];
  const Records = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => {
      mounted.push(hooks);
    }, [hooks]);
    return null;
  };
  threeViewport.Component = Records;
  renderViewport();
  await waitFor(() => expect(mounted).toHaveLength(1));
  expect(screen.queryByRole("progressbar")).toBeNull();

  await act(() => vi.advanceTimersByTimeAsync(400));

  expect(
    screen.getByRole("progressbar", { name: "Loading scene" }),
  ).toBeInTheDocument();
  expect(posted).toContainEqual({ type: "stage", stage: "building" });

  // No onReady: a scene animating a slider is drawn but never settles.
  act(() => mounted[0].onDrawn());

  expect(posted).toContainEqual({ type: "stage", stage: "done" });
  await waitFor(() => expect(screen.queryByRole("progressbar")).toBeNull());
  expect(terminate).toHaveBeenCalled();
});

test("a scene drawn within 400 ms never shows the loading knot", async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  onTestFinished(() => {
    vi.useRealTimers();
  });
  const { posted } = stubKnotLoaderSupport();
  const mounted: ViewportHooks[] = [];
  const Records = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => {
      mounted.push(hooks);
    }, [hooks]);
    return null;
  };
  threeViewport.Component = Records;
  renderViewport();
  await waitFor(() => expect(mounted).toHaveLength(1));
  act(() => mounted[0].onDrawn());

  await act(() => vi.advanceTimersByTimeAsync(1000));

  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(posted).toEqual([]);
});

test("a render error marks the scene failed", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  threeViewport.Component = () => {
    throw new Error("lost the device");
  };
  renderViewport();

  expect(
    await screen.findByText("This scene couldn't be drawn."),
  ).toBeInTheDocument();
  expect(screen.getByTestId("scene")).toHaveAttribute(
    "data-scene-error",
    "error",
  );
});

test("an unsupported browser gets a way to the legacy renderer", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const noBackend = new Error("no backend");
  const Unsupported = ({ hooks }: ThreeViewportProps) => {
    useEffect(() => hooks.onUnsupported(noBackend), [hooks]);
    return null;
  };
  threeViewport.Component = Unsupported;
  renderViewport();

  expect(
    await screen.findByText("This browser can't run the default 3D renderer."),
  ).toBeInTheDocument();
  expect(screen.getByTestId("scene")).toHaveAttribute(
    "data-scene-error",
    "unsupported",
  );
  expect(warn).toHaveBeenCalledWith(noBackend);
  expect(Sentry.captureMessage).toHaveBeenCalledExactlyOnceWith(
    "three.js unsupported: no backend",
    { level: "info" },
  );

  await user.click(
    screen.getByRole("button", { name: "Switch to the legacy renderer" }),
  );
  expect(localStorage.getItem(RENDERER_PREFERENCE_KEY)).toBe("mathbox");
});

test.each([
  { url: "/", transparency: undefined },
  { url: "/?oit=0", transparency: "ordered" },
])(
  "$url asks the renderer for transparency $transparency",
  async ({ url, transparency }) => {
    const Renderer = vi.fn((_props: ThreeViewportProps) => null);
    threeViewport.Component = Renderer;
    renderViewport(url);
    await waitFor(() => expect(Renderer).toHaveBeenCalled());
    expect(Renderer.mock.lastCall?.[0].transparency).toBe(transparency);
  },
);

test.each([
  { url: "/", shading: undefined },
  { url: "/?gloss=0", shading: "matte" },
])("$url asks the renderer for shading $shading", async ({ url, shading }) => {
  const Renderer = vi.fn((_props: ThreeViewportProps) => null);
  threeViewport.Component = Renderer;
  renderViewport(url);
  await waitFor(() => expect(Renderer).toHaveBeenCalled());
  expect(Renderer.mock.lastCall?.[0].shading).toBe(shading);
});
