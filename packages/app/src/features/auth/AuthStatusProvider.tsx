import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useUserMe } from "@math3d/api";
import invariant from "tiny-invariant";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SetAuthStatus = (status: AuthStatus) => void;

const AuthStatusContext = createContext<[AuthStatus, SetAuthStatus]>([
  "loading",
  () => invariant(false, "AuthContext not initialized"),
]);

const AuthStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Override allows optimistic updates from login/logout actions before the
  // useUserMe query refetches.
  const [override, setOverride] = useState<AuthStatus | null>(null);
  const userMeQuery = useUserMe();

  // Derive auth status directly from query data (no useEffect delay).
  // - data is a User object when authenticated
  // - data is null when the query succeeds but user is not authenticated
  // - data is undefined while the query is still pending
  let derived: AuthStatus;
  if (userMeQuery.data) {
    derived = "authenticated";
  } else if (userMeQuery.data === null) {
    derived = "unauthenticated";
  } else if (userMeQuery.isError) {
    derived = "unauthenticated";
  } else {
    derived = "loading";
  }

  // Clear the override once the query catches up, so the query becomes
  // the source of truth again (e.g., if the session expires server-side).
  useEffect(() => {
    if (override !== null && derived !== "loading" && derived === override) {
      setOverride(null);
    }
  }, [derived, override]);

  const isAuthenticated = override ?? derived;

  const setIsAuthenticated: SetAuthStatus = useCallback((value: AuthStatus) => {
    setOverride(value);
  }, []);

  const authState = useMemo<[AuthStatus, SetAuthStatus]>(
    () => [isAuthenticated, setIsAuthenticated],
    [isAuthenticated, setIsAuthenticated],
  );
  return (
    <AuthStatusContext.Provider value={authState}>
      {children}
    </AuthStatusContext.Provider>
  );
};

const useAuthStatus = () => useContext(AuthStatusContext);

export { AuthStatusProvider, useAuthStatus };
export type { AuthStatus };
