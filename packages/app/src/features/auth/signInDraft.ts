import type { RootState } from "@/store/store";
import { APP_VERSION } from "@/version";
import { SIGN_IN_ERROR_PATH } from "./signInErrors";

/**
 * The editor's state, carried across the sign-in redirect in `sessionStorage`
 * (ADR-0004, "Keeping unsaved work across the redirect").
 */
const SIGN_IN_DRAFT_KEY = "math3d:sign-in-draft";
const SIGN_IN_DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

type SignInDraft = {
  // A deploy between save and restore may change the store's shape.
  version: string;
  // The callback_url sign-in returns to.
  url: string;
  savedAt: number;
  state: RootState;
};

// Blocked site data makes storage access throw, and a full quota makes writes
// throw; losing the draft beats failing the sign-in.
const read = (): SignInDraft | undefined => {
  try {
    const raw = sessionStorage.getItem(SIGN_IN_DRAFT_KEY);
    return raw === null ? undefined : (JSON.parse(raw) as SignInDraft);
  } catch {
    return undefined;
  }
};

const discard = (): void => {
  try {
    sessionStorage.removeItem(SIGN_IN_DRAFT_KEY);
  } catch {
    // See `read`.
  }
};

const saveSignInDraft = (
  state: RootState,
  url: string,
  now = Date.now(),
): void => {
  const draft: SignInDraft = { version: APP_VERSION, url, savedAt: now, state };
  try {
    sessionStorage.setItem(SIGN_IN_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // An older draft for the same page would otherwise restore instead.
    discard();
  }
};

/**
 * Called once per page load, before the first render: the draft's own page
 * restores it and every other page discards it, except the sign-in error page,
 * which forwards to the draft's page with a full load.
 */
const takeSignInDraft = (
  pathname: string,
  now = Date.now(),
): RootState | undefined => {
  if (pathname === SIGN_IN_ERROR_PATH) return undefined;
  const draft = read();
  if (!draft) return undefined;
  discard();
  if (
    draft.version !== APP_VERSION ||
    now - draft.savedAt > SIGN_IN_DRAFT_MAX_AGE_MS ||
    new URL(draft.url).pathname !== pathname
  ) {
    return undefined;
  }
  return draft.state;
};

const peekSignInDraftUrl = (): string | undefined => read()?.url;

export {
  SIGN_IN_DRAFT_KEY,
  SIGN_IN_DRAFT_MAX_AGE_MS,
  peekSignInDraftUrl,
  saveSignInDraft,
  takeSignInDraft,
};
