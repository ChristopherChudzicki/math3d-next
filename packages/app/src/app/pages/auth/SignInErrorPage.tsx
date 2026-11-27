import { useEffect } from "react";
import { useRootSearch } from "@/services/navigation/urlState";
import { peekSignInDraftUrl } from "@/services/auth/signInDraft";
import { replaceLocation } from "@/util/replaceLocation";

/**
 * allauth's `socialaccount_login_error`: an error it couldn't return to
 * callback_url. Loads the draft's callback_url with the error instead, as if
 * allauth had returned there; that load restores the draft.
 */
const SignInErrorPage: React.FC = () => {
  const { error } = useRootSearch();
  useEffect(() => {
    const next = new URL(peekSignInDraftUrl() ?? "/", window.location.origin);
    next.searchParams.set("error", error ?? "unknown");
    next.searchParams.set("error_process", "login");
    replaceLocation(next.href);
  }, [error]);
  return null;
};

export default SignInErrorPage;
