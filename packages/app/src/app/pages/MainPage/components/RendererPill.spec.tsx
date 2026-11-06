import { test, expect, vi } from "vitest";
import { makeItem, seedDb } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  renderTestApp,
  screen,
  storeRendererPreference,
  stubWebGpu,
  user,
  waitFor,
} from "@/test_util";
import { findItemByTestId } from "@/test_util/mathItems";
import type { ContentProps } from "@/test_util/gpuViewportContent";

vi.mock("@/features/viewport/usegpu/live/GpuViewportContent", async () => {
  const shared = await import("@/test_util/gpuViewportContent");
  return {
    default: (props: ContentProps) => shared.gpuContent.Component(props),
  };
});

test.each([
  { isAuthenticated: false, trigger: "Open Menu" },
  { isAuthenticated: true, trigger: "Open User Menu" },
])(
  "the pill explains the renderer and switches back, focusing the menu ($trigger)",
  async ({ isAuthenticated, trigger }) => {
    stubWebGpu();
    storeRendererPreference("usegpu");
    renderTestApp("/", { isAuthenticated });
    const menuTrigger = await screen.findByRole("button", { name: trigger });

    await user.click(await screen.findByRole("button", { name: "WebGPU" }));
    const popover = await screen.findByRole("dialog");
    expect(popover).toHaveTextContent(
      "You're using the experimental WebGPU renderer. You can change this in the menu.",
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to the default renderer" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("scene")).toHaveAttribute(
        "data-renderer",
        "mathbox",
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "WebGPU" })).toBeNull(),
    );
    expect(document.activeElement).toBe(menuTrigger);
  },
);

test("under MathBox there is no pill", async () => {
  const item = makeItem(MIT.Point);
  const scene = seedDb.withSceneFromItems([item]);
  renderTestApp(`/${scene.key}`);

  await findItemByTestId(item.id);
  expect(screen.queryByRole("button", { name: "WebGPU" })).toBeNull();
});

test("no pill on the scene-unavailable card", async () => {
  stubWebGpu();
  storeRendererPreference("usegpu");
  renderTestApp("/nonexistent-scene-key");

  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "WebGPU" })).toBeNull();
});
