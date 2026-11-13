import { test, expect } from "vitest";
import {
  renderTestApp,
  screen,
  storeRendererPreference,
  user,
  waitFor,
} from "@/test_util";

test.each([
  { isAuthenticated: false, trigger: "Open Menu" },
  { isAuthenticated: true, trigger: "Open User Menu" },
])(
  "the pill explains the renderer and switches back, focusing the menu trigger ($trigger)",
  async ({ isAuthenticated, trigger }) => {
    storeRendererPreference("threejs");
    renderTestApp("/", { isAuthenticated });
    const menuTrigger = await screen.findByRole("button", { name: trigger });

    await user.click(
      await screen.findByRole("button", { name: "three.js renderer" }),
    );
    const popover = await screen.findByRole("dialog", {
      name: "three.js renderer",
    });
    expect(popover).toHaveTextContent(
      "You're using the experimental three.js renderer. You can also change this in the menu.",
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
      expect(
        screen.queryByRole("button", { name: "three.js renderer" }),
      ).toBeNull(),
    );
    expect(menuTrigger).toHaveFocus();
  },
);

test("no pill on the scene-unavailable card", async () => {
  storeRendererPreference("threejs");
  renderTestApp("/nonexistent-scene-key");

  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "three.js renderer" }),
  ).toBeNull();
});
