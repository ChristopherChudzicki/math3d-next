import { test, expect } from "vitest";
import { renderTestApp, screen } from "@/test_util";

test("no overlay param renders no dialog", async () => {
  await renderTestApp("/");
  expect(screen.queryByRole("dialog")).toBe(null);
});

test("unknown overlay value renders nothing and is left in the URL", async () => {
  const { location } = await renderTestApp("/?overlay=bogus");
  expect(screen.queryByRole("dialog")).toBe(null);
  expect(location.current.search).toContain("overlay=bogus");
});
