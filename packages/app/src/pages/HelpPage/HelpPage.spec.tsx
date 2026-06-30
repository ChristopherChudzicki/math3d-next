import { test, expect } from "vitest";
import { renderTestApp, screen } from "@/test_util";

test("help reference loads at /app/help/reference", async () => {
  await renderTestApp("/app/help/reference");
  expect(
    await screen.findByRole("heading", { name: "Function Reference" }),
  ).toBeVisible();
});

test("an overlay opens over an /app page (host wraps both subtrees)", async () => {
  // R3 AC: overlays are openable from any route, including /app/... pages.
  await renderTestApp("/app/help/reference?overlay=login");
  // HelpPage is in the tree — MUI Dialog sets aria-hidden on the background, so
  // query with { hidden: true } to reach it; toBeInTheDocument() confirms presence.
  expect(
    await screen.findByRole("heading", {
      name: "Function Reference",
      hidden: true,
    }),
  ).toBeInTheDocument();
  // The dialog proves OverlayHost rendered successfully on this /app/... route.
  expect(await screen.findByRole("dialog", { name: "Sign in" })).toBeVisible();
});
