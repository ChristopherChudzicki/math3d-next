import type { Page } from "@playwright/test";

/**
 * Collects page errors and `console.error` messages from here on. Failed
 * requests log to the console too; only `/me` may fail (signed out, it
 * answers 403).
 */
export const collectPageErrors = (page: Page): string[] => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const signedOutMe =
      message.text().startsWith("Failed to load resource") &&
      /\/me\/?$/.test(new URL(message.location().url).pathname);
    if (!signedOutMe) errors.push(message.text());
  });
  return errors;
};
