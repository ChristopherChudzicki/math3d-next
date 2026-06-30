import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor } from "@/test_util";

test("Settings dialog opens via overlay param and closes by clearing it", async () => {
  const { location } = await renderTestApp("/?overlay=settings", {
    isAuthenticated: true,
  });
  const dialog = await screen.findByRole("dialog", {
    name: "Account Settings",
  });
  expect(dialog).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
});
