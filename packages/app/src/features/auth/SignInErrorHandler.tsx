import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { SIGN_IN_ERROR_PATH, toSignInError } from "./signInErrors";
import { useAuthStatus } from "./useAuthStatus";

/** Turns allauth's `?error=` return into the sign-in dialog showing it. */
const SignInErrorHandler: React.FC = () => {
  const [search] = useSearchParams();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const authStatus = useAuthStatus();

  useEffect(() => {
    // SignInErrorPage forwards its error to the draft's page first.
    if (pathname === SIGN_IN_ERROR_PATH) return;
    const code = search.get("error");
    if (code === null || !search.has("error_process")) return;
    if (authStatus === "loading") return;
    const next = new URLSearchParams(search);
    next.delete("error");
    next.delete("error_process");
    // Already signed in, e.g. after Back to Google replayed a used state.
    if (authStatus === "authenticated") {
      navigate({ search: next.toString(), hash }, { replace: true });
      return;
    }
    next.set("overlay", "login");
    navigate(
      { search: next.toString(), hash },
      { replace: true, state: { signInError: toSignInError(code) } },
    );
  }, [search, pathname, hash, navigate, authStatus]);

  return null;
};

export default SignInErrorHandler;
