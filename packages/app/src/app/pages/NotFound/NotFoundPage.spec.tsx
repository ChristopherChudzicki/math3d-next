import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

test.each([
  ["an unmatched /app path", "/app/does-not-exist"],
  ["/app, which can't be a scene key", "/app"],
  ["a key Django would never issue", "/a"],
  ["a path in the wrong case", "/APP/help/reference"],
  ["a multi-segment path", "/.well-known/foo"],
])("%s renders the soft-404", async (_, url) => {
  await renderTestApp(url);
  expect(
    await screen.findByRole("heading", { name: /not found/i }),
  ).toBeVisible();
});

test("a dialog opened on the soft-404 closes without leaving it", async () => {
  const { location } = await renderTestApp("/app/does-not-exist?signin");
  await screen.findByRole("dialog", { name: "Sign in" });

  await user.keyboard("{Escape}");

  await waitFor(() => expect(location.current.search).toBe(""));
  expect(location.current.pathname).toBe("/app/does-not-exist");
});

test("the soft-404 links back to the editor", async () => {
  await renderTestApp("/app/does-not-exist");
  const main = await screen.findByRole("main");
  expect(
    within(main).getByRole("link", { name: "Back to Math3d" }),
  ).toHaveAttribute("href", "/");
});

test("the header's wordmark links home for the mouse only", async () => {
  await renderTestApp("/app/does-not-exist");
  const banner = await screen.findByRole("banner");
  expect(
    within(banner)
      .getAllByRole("link")
      .map((link) => link.textContent),
  ).toEqual(["Back to Math3d"]);
  const wordmark = within(banner).getByText("Math3d").closest("a");
  expect(wordmark).toHaveAttribute("href", "/");
  expect(wordmark).toHaveAttribute("tabindex", "-1");
});
