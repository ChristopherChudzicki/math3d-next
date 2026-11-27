import { test, expect } from "vitest";
import { renderTestApp, screen, within } from "@/test_util";

test("help reference loads at /app/help/reference", async () => {
  await renderTestApp("/app/help/reference");
  expect(
    await screen.findByRole("heading", { name: "Function Reference" }),
  ).toBeVisible();
  // A compiled doc, so this fails if the docs glob matches nothing.
  expect(await screen.findByText("sin(x)")).toBeVisible();
});

test("an overlay opens over an /app page (host wraps both subtrees)", async () => {
  // R3 AC: overlays are openable from any route, including /app/... pages.
  await renderTestApp("/app/help/reference?overlay=scenes");
  // HelpPage is in the tree — the modal overlay aria-hides the background, so
  // query with { hidden: true } to reach it; toBeInTheDocument() confirms presence.
  expect(
    await screen.findByRole("heading", {
      name: "Function Reference",
      hidden: true,
    }),
  ).toBeInTheDocument();
  // The dialog proves UrlLayerHost rendered successfully on this /app/... route.
  expect(await screen.findByRole("tablist", { name: "Scenes" })).toBeVisible();
});

test("only the contents link to the section in the URL is current", async () => {
  await renderTestApp("/app/help/reference#trig");
  const contents = await screen.findByRole("navigation", {
    name: "Reference Sections",
  });
  const current = within(contents)
    .getAllByRole("link")
    .filter((link) => link.getAttribute("aria-current") === "page");
  expect(current.map((link) => link.textContent)).toEqual(["Trigonometry"]);
});
