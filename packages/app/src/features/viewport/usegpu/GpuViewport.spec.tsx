import React, { useEffect } from "react";
import { act, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import * as Sentry from "@sentry/react";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import GpuViewport from "./GpuViewport";

vi.mock("@sentry/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@sentry/react")>()),
  captureMessage: vi.fn(),
}));

type ContentProps = { onUnsupported: (error: unknown) => void };

// Stands in for usegpu/live; each test that renders it picks how it fails.
const content = vi.hoisted(() => {
  const RendersNothing = (_props: ContentProps): null => null;
  return { Component: RendersNothing, RendersNothing };
});
vi.mock("./live/GpuViewportContent", () => ({
  default: (props: ContentProps) => content.Component(props),
}));

const noAdapter = new Error("no adapter");
const ReportsUnsupported = ({ onUnsupported }: ContentProps) => {
  useEffect(() => onUnsupported(noAdapter), [onUnsupported]);
  return null;
};
const FailsToLoad = (): null => {
  throw new Error("Failed to fetch dynamically imported module");
};

const LocationProbe = () => {
  const { pathname, search } = useLocation();
  return <output aria-label="location">{`${pathname}${search}`}</output>;
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
      <MemoryRouter initialEntries={["/abc?renderer=usegpu&controls=0"]}>
        <GpuViewport />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );
  return { store };
};

afterEach(() => {
  content.Component = content.RendersNothing;
  localStorage.clear();
  // @ts-expect-error navigator.gpu is required in @webgpu/types; one test adds a stand-in.
  delete navigator.gpu;
});

test("with 3D disabled it renders the empty scene container", () => {
  localStorage.setItem("disable3dScene", "true");
  renderViewport();
  expect(screen.getByTestId("scene")).toBeEmptyDOMElement();
});

test("without navigator.gpu it says WebGPU is unavailable and links to the default renderer", async () => {
  renderViewport();
  expect(screen.getByText(/WebGPU is unavailable/)).toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Use the default renderer" });
  expect(link).toHaveAttribute("href", "/abc?controls=0");
  // A router navigation, not a page load, so unsaved edits survive.
  await user.click(link);
  expect(screen.getByLabelText("location")).toHaveTextContent(
    "/abc?controls=0",
  );
});

test("when the renderer reports WebGPU unsupported it says so and reports why", async () => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
  Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  content.Component = ReportsUnsupported;
  renderViewport();
  expect(await screen.findByText(/WebGPU is unavailable/)).toBeInTheDocument();
  expect(Sentry.captureMessage).toHaveBeenCalledWith(
    "WebGPU unsupported: no adapter",
    { level: "info" },
  );
});

test("when the renderer throws it says so in the viewport until another scene loads", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  content.Component = FailsToLoad;
  const { store } = renderViewport();
  expect(
    await screen.findByText(/The Use.GPU renderer stopped on an error/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Use the default renderer" }),
  ).toBeInTheDocument();

  content.Component = content.RendersNothing;
  act(() => loadScene(store));
  expect(screen.queryByText(/stopped on an error/)).not.toBeInTheDocument();
});
