import { test } from "@/fixtures/users";
import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import AppPage from "@/utils/pages/AppPage";

test.use({ user: "worker" });

type Recorder = { transitions: string[] };

/**
 * Records each enter and exit as it starts, with the tab an exit shows.
 * `data-starting-style` lasts one frame, too briefly for a locator to catch.
 */
const recordTransitions = (page: Page) =>
  page.evaluate(() => {
    const recorder = window as unknown as Recorder;
    recorder.transitions = [];
    const record = (el: Element) => {
      if (el.getAttribute("role") !== "dialog") return;
      const tab = el.querySelector('[role="tab"][aria-selected="true"]');
      let entry: string | null = null;
      if (el.hasAttribute("data-starting-style")) entry = "enter";
      if (el.hasAttribute("data-ending-style")) {
        entry = `exit from ${tab?.textContent}${el.hasAttribute("inert") ? " (inert)" : ""}`;
      }
      if (entry && recorder.transitions.at(-1) !== entry) {
        recorder.transitions.push(entry);
      }
    };
    new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes") {
          record(mutation.target as Element);
        }
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          record(node);
          node.querySelectorAll('[role="dialog"]').forEach(record);
        });
      });
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-starting-style", "data-ending-style"],
    });
  });

const transitions = (page: Page) =>
  page.evaluate(() => (window as unknown as Recorder).transitions);

test("The scenes drawer animates in, and out by Escape or Back", async ({
  page,
}) => {
  await page.goto("/");
  // The button opens My Scenes only once it knows the user is signed in.
  await expect(new AppPage(page).userMenu().avatarOpener()).toBeVisible();
  await recordTransitions(page);
  const drawer = page.getByRole("dialog", { name: "Scenes" });

  // Closing drops `?list=`, which reads as Examples; the exit must still show
  // My Scenes.
  await page.getByRole("button", { name: "Open scenes" }).click();
  await expect(drawer).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  expect(await transitions(page)).toEqual([
    "enter",
    "exit from My Scenes (inert)",
  ]);

  await page.getByRole("button", { name: "Open scenes" }).click();
  await expect(drawer).toBeVisible();
  await page.goBack();
  await expect(drawer).toBeHidden();
  expect(await transitions(page)).toEqual([
    "enter",
    "exit from My Scenes (inert)",
    "enter",
    "exit from My Scenes (inert)",
  ]);
});
