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

const injectedScript = (): HTMLScriptElement => {
  const script = document.querySelector<HTMLScriptElement>(
    'script[src^="https://accounts.google.com"]',
  );
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
