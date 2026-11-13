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
    storeRendererPreference("mathbox");
    renderTestApp("/", { isAuthenticated });
    const menuTrigger = await screen.findByRole("button", { name: trigger });

    await user.click(
      await screen.findByRole("button", { name: "MathBox renderer" }),
    );
    const popover = await screen.findByRole("dialog", {
      name: "MathBox renderer",
    });
    expect(popover).toHaveTextContent(
      "You're using the legacy MathBox renderer. You can also change this in the menu.",
    );

    await user.click(
      screen.getByRole("button", { name: "Switch to the default renderer" }),
    );
    await waitFor(() =>
      expect(screen.getByTestId("scene")).toHaveAttribute(
        "data-renderer",
        "threejs",
      ),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "MathBox renderer" }),
      ).toBeNull(),
    );
    expect(menuTrigger).toHaveFocus();
  },
);

test("no pill on the scene-unavailable card", async () => {
  storeRendererPreference("mathbox");
  renderTestApp("/nonexistent-scene-key");

  expect(
    await screen.findByRole("heading", { name: "This scene doesn’t exist." }),
  ).toBeVisible();
  expect(screen.queryByRole("button", { name: "MathBox renderer" })).toBeNull();
});
