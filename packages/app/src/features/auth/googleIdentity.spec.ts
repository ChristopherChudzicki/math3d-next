import { test, expect, beforeEach, afterEach, vi } from "vitest";
import type { GoogleIdentityApi } from "./googleIdentity";

let loadGoogleIdentity: typeof import("./googleIdentity").loadGoogleIdentity;

const api: GoogleIdentityApi = { initialize: vi.fn(), renderButton: vi.fn() };

// The loader memoizes its in-flight promise at module scope, so each test gets
// a fresh copy of the module rather than the previous test's cached result.
beforeEach(async () => {
  vi.resetModules();
  ({ loadGoogleIdentity } = await import("./googleIdentity"));
});

afterEach(() => {
  delete window.google;
  document
    .querySelectorAll('script[src^="https://accounts.google.com"]')
    .forEach((el) => el.remove());
});

// A retry after a failure injects a second script tag alongside the first
// (nothing removes the old one mid-test), so this returns the most recently
// appended match rather than the first.
const injectedScript = (): HTMLScriptElement => {
  const scripts = document.querySelectorAll<HTMLScriptElement>(
    'script[src^="https://accounts.google.com"]',
  );
  const script = scripts[scripts.length - 1];
  if (!script) throw new Error("The gsi/client script was not injected.");
  return script;
};

test("resolves the API once the injected script has defined window.google", async () => {
  const pending = loadGoogleIdentity();
  const script = injectedScript();
  window.google = { accounts: { id: api } };
  script.dispatchEvent(new Event("load"));
  await expect(pending).resolves.toBe(api);
});

test("rejects when the script fails to load", async () => {
  const pending = loadGoogleIdentity();
  injectedScript().dispatchEvent(new Event("error"));
  await expect(pending).rejects.toThrow(/accounts\.google\.com/);
});

test("rejects when the script loads without defining google.accounts.id", async () => {
  const pending = loadGoogleIdentity();
  injectedScript().dispatchEvent(new Event("load"));
  await expect(pending).rejects.toThrow(/google\.accounts\.id/);
});

test("a failed load clears the memo so a later call retries and can succeed", async () => {
  const failed = loadGoogleIdentity();
  injectedScript().dispatchEvent(new Event("error"));
  await expect(failed).rejects.toThrow();

  const retried = loadGoogleIdentity();
  window.google = { accounts: { id: api } };
  injectedScript().dispatchEvent(new Event("load"));
  await expect(retried).resolves.toBe(api);
});
