import { expect } from "@playwright/test";
import { test } from "@/fixtures/users";

test("Has expected headers and links", async ({ page }) => {
  await page.goto("/app/help/reference");
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
    "Axes",
    "Calculus",
    "Constants",
    "Logs & Exponents",
    "Lists",
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
  expect(hrefs).toEqual(headers.map((id) => `/app/help/reference#${id}`));
});

test("Contents links scroll to their sections, and Back scrolls back", async ({
  page,
}) => {
  await page.goto("/app/help/reference");
  const contents = page.getByRole("navigation", { name: "Reference Sections" });
  const link = (name: string) =>
    contents.getByRole("link", { name, exact: true });
  const scrollY = () => page.evaluate(() => window.scrollY);

  await link("Trigonometry").click();
  await expect.poll(scrollY).toBeGreaterThan(2500);
  const atTrigonometry = await scrollY();
  await page.mouse.wheel(0, 800);
  await expect.poll(scrollY).toBeGreaterThan(atTrigonometry);
  const leftTrigonometry = await scrollY();

  await link("Algebra").click();
  await expect.poll(scrollY).toBeLessThan(500);
  const atAlgebra = await scrollY();
  // A second visit lands on the section, not where the first one was left.
  await link("Trigonometry").click();
  await expect.poll(scrollY).toBe(atTrigonometry);
  await page.mouse.wheel(0, -300);
  await expect.poll(scrollY).toBeLessThan(atTrigonometry);

  // Each visit keeps its own position, though both have the same URL.
  await page.goBack();
  await expect.poll(scrollY).toBe(atAlgebra);
  await page.goBack();
  await expect.poll(scrollY).toBe(leftTrigonometry);
});

test("Fits a phone-width viewport with every entry expanded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/app/help/reference");
  const showMore = page.getByRole("button", { name: "Show more" });
  await expect(showMore.first()).toBeVisible();
  await showMore.evaluateAll((buttons) => {
    buttons.forEach((button) => (button as HTMLElement).click());
  });
  await expect(showMore).toHaveCount(0);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
