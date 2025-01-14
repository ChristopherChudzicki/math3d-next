import { expect, test } from "@playwright/test";

test("Has expected headers and links", async ({ page }) => {
  await page.goto("/help/reference");
  const nav = page.getByRole("navigation", {
    name: "Reference Sections",
  });
  await expect(
    page
      .getByRole("heading", { name: "Function Reference" })
      .and(page.locator("h1")),
  ).toBeVisible();

  const links = nav.getByRole("link");
  const expected = [
    "Algebra",
    "Calculus",
    "Constants",
    "Logs & Exponents",
    "Miscellaneous",
    "Trigonometry",
    "Trigonometry (Hyperbolic)",
  ];
  await expect(links).toHaveText(expected);
  const hrefs = await links.evaluateAll((els) =>
    els.map((el) => el.getAttribute("href")),
  );
  const headers = await page.locator("h2").evaluateAll((els) => {
    return els.map((el) => el.id);
  });
  expect(hrefs).toEqual(headers.map((id) => `#${id}`));
});
