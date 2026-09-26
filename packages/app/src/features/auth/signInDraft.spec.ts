import { afterEach, expect, test, vi } from "vitest";
import { getStore } from "@/store/store";
import {
  SIGN_IN_DRAFT_KEY,
  SIGN_IN_DRAFT_MAX_AGE_MS,
  discardSignInDraftOnPageRestore,
  peekSignInDraftPathname,
  saveSignInDraft,
  takeSignInDraft,
} from "./signInDraft";

afterEach(() => {
  vi.restoreAllMocks();
});

const state = () => getStore().getState();

test("a draft is taken once, on its own pathname", () => {
  saveSignInDraft(state(), "/abc", 1000);

  expect(takeSignInDraft("/abc", 2000)).toEqual(state());
  expect(takeSignInDraft("/abc", 2000)).toBeUndefined();
});

test("another pathname leaves the draft for later", () => {
  saveSignInDraft(state(), "/abc", 1000);

  expect(takeSignInDraft("/other", 2000)).toBeUndefined();
  expect(peekSignInDraftPathname()).toBe("/abc");
});

test("an expired draft is discarded", () => {
  saveSignInDraft(state(), "/abc", 1000);

  expect(
    takeSignInDraft("/abc", 1000 + SIGN_IN_DRAFT_MAX_AGE_MS + 1),
  ).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("a draft written by another app version is discarded", () => {
  saveSignInDraft(state(), "/abc", 1000);
  const stored = JSON.parse(sessionStorage.getItem(SIGN_IN_DRAFT_KEY) ?? "{}");
  sessionStorage.setItem(
    SIGN_IN_DRAFT_KEY,
    JSON.stringify({ ...stored, version: "some-older-build" }),
  );

  expect(takeSignInDraft("/abc", 2000)).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("storage that throws never breaks sign-in", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });

  expect(() => saveSignInDraft(state(), "/abc")).not.toThrow();
  expect(takeSignInDraft("/abc")).toBeUndefined();
});

test("only a page restored from the back/forward cache discards the draft", () => {
  const uninstall = discardSignInDraftOnPageRestore();
  saveSignInDraft(state(), "/abc");

  window.dispatchEvent(
    new PageTransitionEvent("pageshow", { persisted: false }),
  );
  expect(peekSignInDraftPathname()).toBe("/abc");

  window.dispatchEvent(
    new PageTransitionEvent("pageshow", { persisted: true }),
  );
  expect(peekSignInDraftPathname()).toBeUndefined();
  uninstall();
});
