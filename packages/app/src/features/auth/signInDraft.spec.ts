import { afterEach, expect, test, vi } from "vitest";
import { getStore } from "@/store/store";
import {
  SIGN_IN_DRAFT_KEY,
  SIGN_IN_DRAFT_MAX_AGE_MS,
  discardSignInDraftOnPageRestore,
  peekSignInDraftUrl,
  saveSignInDraft,
  takeSignInDraft,
} from "./signInDraft";
import { SIGN_IN_ERROR_PATH } from "./signInErrors";

afterEach(() => {
  vi.restoreAllMocks();
});

const state = () => getStore().getState();
const url = `${window.location.origin}/abc?controls=0`;

test("a draft is taken once, on its own page", () => {
  saveSignInDraft(state(), url, 1000);

  expect(takeSignInDraft("/abc", 2000)).toEqual(state());
  expect(takeSignInDraft("/abc", 2000)).toBeUndefined();
});

test("any other page discards the draft", () => {
  saveSignInDraft(state(), url, 1000);

  expect(takeSignInDraft("/other", 2000)).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("the sign-in error page leaves the draft for the page it forwards to", () => {
  saveSignInDraft(state(), url, 1000);

  expect(takeSignInDraft(SIGN_IN_ERROR_PATH, 2000)).toBeUndefined();
  expect(peekSignInDraftUrl()).toBe(url);
});

test("an expired draft is discarded", () => {
  saveSignInDraft(state(), url, 1000);

  expect(
    takeSignInDraft("/abc", 1000 + SIGN_IN_DRAFT_MAX_AGE_MS + 1),
  ).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("a draft written by another app version is discarded", () => {
  saveSignInDraft(state(), url, 1000);
  const stored = JSON.parse(sessionStorage.getItem(SIGN_IN_DRAFT_KEY) ?? "{}");
  sessionStorage.setItem(
    SIGN_IN_DRAFT_KEY,
    JSON.stringify({ ...stored, version: "some-older-build" }),
  );

  expect(takeSignInDraft("/abc", 2000)).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("a draft without a usable url is discarded", () => {
  saveSignInDraft(state(), url, 1000);
  const stored = JSON.parse(sessionStorage.getItem(SIGN_IN_DRAFT_KEY) ?? "{}");
  sessionStorage.setItem(
    SIGN_IN_DRAFT_KEY,
    JSON.stringify({ ...stored, url: undefined }),
  );

  expect(takeSignInDraft("/abc", 2000)).toBeUndefined();
  expect(sessionStorage.getItem(SIGN_IN_DRAFT_KEY)).toBeNull();
});

test("only a page restored from the back/forward cache discards the draft", () => {
  const uninstall = discardSignInDraftOnPageRestore();
  saveSignInDraft(state(), url);

  window.dispatchEvent(
    new PageTransitionEvent("pageshow", { persisted: false }),
  );
  expect(peekSignInDraftUrl()).toBe(url);

  window.dispatchEvent(
    new PageTransitionEvent("pageshow", { persisted: true }),
  );
  expect(peekSignInDraftUrl()).toBeUndefined();
  uninstall();
});

test("a failed write leaves no older draft to restore", () => {
  saveSignInDraft(state(), url, 1000);
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });

  saveSignInDraft(state(), url, 2000);

  expect(takeSignInDraft("/abc", 3000)).toBeUndefined();
});

test("storage that throws never breaks sign-in", () => {
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new DOMException("quota", "QuotaExceededError");
  });
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("denied", "SecurityError");
  });

  expect(() => saveSignInDraft(state(), url)).not.toThrow();
  expect(takeSignInDraft("/abc")).toBeUndefined();
});
