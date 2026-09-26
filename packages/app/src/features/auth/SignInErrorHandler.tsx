import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import { SIGN_IN_ERROR_PATH, toSignInError } from "./signInErrors";

/** Turns allauth's `?error=` return into the sign-in dialog showing it. */
const SignInErrorHandler: React.FC = () => {
  const [search] = useSearchParams();
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // SignInErrorPage forwards its error to the draft's page first.
    if (pathname === SIGN_IN_ERROR_PATH) return;
    const code = search.get("error");
    if (code === null || !search.has("error_process")) return;
    const next = new URLSearchParams(search);
    next.delete("error");
    next.delete("error_process");
    next.set("overlay", "login");
    navigate(
      { search: next.toString(), hash },
      { replace: true, state: { signInError: toSignInError(code) } },
    );
  }, [search, pathname, hash, navigate]);

  return null;
};

export default SignInErrorHandler;
