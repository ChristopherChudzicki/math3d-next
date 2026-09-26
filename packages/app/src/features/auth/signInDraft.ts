import type { RootState } from "@/store/store";
import { APP_VERSION } from "@/version";

/**
 * The editor's state, carried across the sign-in redirect in `sessionStorage`
 * (ADR-0004, "Keeping unsaved work across the redirect").
 */
const SIGN_IN_DRAFT_KEY = "math3d:sign-in-draft";
const SIGN_IN_DRAFT_MAX_AGE_MS = 60 * 60 * 1000;

type SignInDraft = {
  // A deploy between save and restore may change the store's shape.
  version: string;
  pathname: string;
  savedAt: number;
  state: RootState;
};

// Private windows and blocked site data throw on any storage access; losing
// the draft beats failing the sign-in.
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
  pathname: string,
  now = Date.now(),
): void => {
  const draft: SignInDraft = {
    version: APP_VERSION,
    pathname,
    savedAt: now,
    state,
  };
  try {
    sessionStorage.setItem(SIGN_IN_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // See `read`.
  }
};

const takeSignInDraft = (
  pathname: string,
  now = Date.now(),
): RootState | undefined => {
  const draft = read();
  if (!draft) return undefined;
  if (
    draft.version !== APP_VERSION ||
    now - draft.savedAt > SIGN_IN_DRAFT_MAX_AGE_MS
  ) {
    discard();
    return undefined;
  }
  if (draft.pathname !== pathname) return undefined;
  discard();
  return draft.state;
};

const peekSignInDraftPathname = (): string | undefined => read()?.pathname;

/**
 * A page restored from the back/forward cache still holds its live state,
 * which is newer than any draft; a later reload must not bring the draft back.
 */
const discardSignInDraftOnPageRestore = (): (() => void) => {
  const onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) discard();
  };
  window.addEventListener("pageshow", onPageShow);
  return () => window.removeEventListener("pageshow", onPageShow);
};

export {
  SIGN_IN_DRAFT_KEY,
  SIGN_IN_DRAFT_MAX_AGE_MS,
  discardSignInDraftOnPageRestore,
  peekSignInDraftPathname,
  saveSignInDraft,
  takeSignInDraft,
};
