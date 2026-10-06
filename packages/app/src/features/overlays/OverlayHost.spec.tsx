import { test, expect } from "vitest";
import { renderTestApp, screen, user, waitFor } from "@/test_util";

test("no overlay param renders no dialog", () => {
  renderTestApp("/");
  expect(screen.queryByRole("dialog")).toBe(null);
});

test("unknown overlay value renders nothing and is left in the URL", () => {
  const { location } = renderTestApp("/?overlay=bogus");
  expect(screen.queryByRole("dialog")).toBe(null);
  expect(location.current.search).toContain("overlay=bogus");
});

// `constructor` resolves to a function and `__proto__` to an object via the
// prototype chain — a bare `OVERLAYS[name]` would render either and crash the
// app to the branded ErrorPage. They must be treated like any other unknown value.
test.each(["constructor", "__proto__"])(
  "prototype-chain overlay value %s renders nothing and is left untouched",
  (value) => {
    const { location } = renderTestApp(`/?overlay=${value}`);
    expect(screen.queryByRole("dialog")).toBe(null);
    expect(location.current.search).toContain(`overlay=${value}`);
    // The root errorElement (branded ErrorPage) must not have been triggered.
    expect(screen.queryByText("We hit a discontinuity.")).toBe(null);
  },
);

test("Sign-in loaded over an overlay hides the overlay and takes focus", async () => {
  renderTestApp("/?overlay=scenes&list=me&signin");

  const signIn = await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(signIn).toContainElement(document.activeElement));
  expect(screen.queryByRole("dialog", { name: "Scenes" })).toBe(null);
  expect(
    screen.getByRole("dialog", { name: "Scenes", hidden: true }),
  ).toBeInTheDocument();
});

test("Escape closes sign-in and leaves the overlay beneath it open", async () => {
  const { location } = renderTestApp("/?overlay=scenes&list=me&signin");
  const signIn = await screen.findByRole("dialog", { name: "Sign in" });
  await waitFor(() => expect(signIn).toContainElement(document.activeElement));

  await user.keyboard("{Escape}");

  await waitFor(() =>
    expect(location.current.search).toBe("?overlay=scenes&list=me"),
  );
  expect(
    await screen.findByRole("dialog", { name: "Scenes" }),
  ).toBeInTheDocument();
});
