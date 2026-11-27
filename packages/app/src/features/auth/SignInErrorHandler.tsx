import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";
import { useRootSearch } from "@/services/navigation/urlState";
import { useSetSearch } from "@/services/navigation/useSetSearch";
import { useAuthStatus } from "@/services/auth/useAuthStatus";
import { SIGN_IN_ERROR_PATH } from "@/config/paths";
import { toSignInError } from "@/services/auth/signInErrorCodes";

/** Turns allauth's `?error=` return into the sign-in dialog showing it. */
const SignInErrorHandler: React.FC = () => {
  const onSignInErrorPage = useLocation({
    select: (location) => location.pathname === SIGN_IN_ERROR_PATH,
  });
  const { error: code, error_process: errorProcess } = useRootSearch();
  const setSearch = useSetSearch();
  const authStatus = useAuthStatus();

  useEffect(() => {
    // SignInErrorPage forwards its error to the draft's page first.
    if (onSignInErrorPage) return;
    if (code === undefined || errorProcess === undefined) return;
    if (authStatus === "loading") return;
    const cleared = { error: undefined, error_process: undefined };
    // Already signed in, e.g. after Back to Google replayed a used state.
    if (authStatus === "authenticated") {
      setSearch(cleared, { replace: true });
      return;
    }
    setSearch(
      { ...cleared, signin: "" },
      { replace: true, state: () => ({ signInError: toSignInError(code) }) },
    );
  }, [code, errorProcess, onSignInErrorPage, setSearch, authStatus]);

  return null;
};

export default SignInErrorHandler;
