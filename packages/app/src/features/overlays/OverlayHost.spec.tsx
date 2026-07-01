import { test, expect } from "vitest";
import { renderTestApp, screen } from "@/test_util";

test("no overlay param renders no dialog", async () => {
  renderTestApp("/");
  expect(screen.queryByRole("dialog")).toBe(null);
});

test("unknown overlay value renders nothing and is left in the URL", async () => {
  const { location } = renderTestApp("/?overlay=bogus");
  expect(screen.queryByRole("dialog")).toBe(null);
  expect(location.current.search).toContain("overlay=bogus");
});

// `constructor` resolves to a function and `__proto__` to an object via the
// prototype chain — a bare `OVERLAYS[name]` would render either and crash the
// app to the branded ErrorPage. They must be treated like any other unknown value.
test.each(["constructor", "__proto__"])(
  "prototype-chain overlay value %s renders nothing and is left untouched",
  async (value) => {
    const { location } = renderTestApp(`/?overlay=${value}`);
    expect(screen.queryByRole("dialog")).toBe(null);
    expect(location.current.search).toContain(`overlay=${value}`);
    // The root errorElement (branded ErrorPage) must not have been triggered.
    expect(screen.queryByText("We hit a discontinuity.")).toBe(null);
  },
);
