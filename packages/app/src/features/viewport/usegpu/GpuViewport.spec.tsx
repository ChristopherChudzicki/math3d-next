import React, { useEffect } from "react";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, useLocation } from "react-router";
import user from "@testing-library/user-event";
import { SceneBuilder } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import GpuViewport from "./GpuViewport";

// Stands in for a WebGPU device that fails to mount.
const FailingContent = ({
  onUnsupported,
}: {
  onUnsupported: (error: unknown) => void;
}) => {
  useEffect(() => onUnsupported(new Error("no adapter")), [onUnsupported]);
  return null;
};
vi.mock("./live/GpuViewportContent", () => ({ default: FailingContent }));

const LocationProbe = () => {
  const { pathname, search } = useLocation();
  return <output aria-label="location">{`${pathname}${search}`}</output>;
};

const renderViewport = () => {
  const scene = new SceneBuilder();
  const store = getStore();
  store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/abc?renderer=usegpu&controls=0"]}>
        <GpuViewport />
        <LocationProbe />
      </MemoryRouter>
    </Provider>,
  );
};

afterEach(() => {
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

test("when the device fails to mount it says WebGPU is unavailable and logs why", async () => {
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  Object.defineProperty(navigator, "gpu", { value: {}, configurable: true });
  renderViewport();
  expect(await screen.findByText(/WebGPU is unavailable/)).toBeInTheDocument();
  expect(error).toHaveBeenCalledWith(new Error("no adapter"));
});
