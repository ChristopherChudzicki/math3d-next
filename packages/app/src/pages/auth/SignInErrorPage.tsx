import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { peekSignInDraftUrl } from "@/features/auth/signInDraft";
import { replaceLocation } from "@/util/replaceLocation";

/**
 * allauth's `socialaccount_login_error`: an error it couldn't return to
 * callback_url. Loads the draft's callback_url with the error instead, as if
 * allauth had returned there; that load restores the draft.
 */
const SignInErrorPage: React.FC = () => {
  const [search] = useSearchParams();
  useEffect(() => {
    const next = new URL(peekSignInDraftUrl() ?? "/", window.location.origin);
    next.searchParams.set("error", search.get("error") ?? "unknown");
    next.searchParams.set("error_process", "login");
    replaceLocation(next.href);
  }, [search]);
  return null;
};

export default SignInErrorPage;
