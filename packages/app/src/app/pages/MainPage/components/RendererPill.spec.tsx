import { test, expect } from "vitest";
import {
  renderTestApp,
  screen,
  storeRendererPreference,
  stubWebGpu,
  user,
  waitFor,
} from "@/test_util";

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
    const popover = await screen.findByRole("dialog", {
      name: "WebGPU renderer",
    });
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

test("no pill on the scene-unavailable card", async () => {
  stubWebGpu();
  storeRendererPreference("usegpu");
  renderTestApp("/nonexistent-scene-key");

  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "WebGPU" })).toBeNull();
});
