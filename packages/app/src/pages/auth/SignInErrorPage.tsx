import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { peekSignInDraftPathname } from "@/features/auth/signInDraft";

/**
 * allauth's `socialaccount_login_error`: an error it couldn't return to
 * callback_url. Forwards to the page the draft came from, which restores it.
 */
const SignInErrorPage: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  useEffect(() => {
    const next = new URLSearchParams({
      error: search.get("error") ?? "unknown",
      error_process: "login",
    });
    navigate(
      { pathname: peekSignInDraftPathname() ?? "/", search: next.toString() },
      { replace: true },
    );
  }, [search, navigate]);
  return null;
};

export default SignInErrorPage;
