import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useUserMe } from "@math3d/api";
import invariant from "tiny-invariant";

type AuthStatus = boolean | null; // null = loading/unknown

const AuthStatusContext = createContext<
  [AuthStatus, React.Dispatch<React.SetStateAction<AuthStatus>>]
>([null, () => invariant(false, "AuthContext not initialized")]);

const AuthStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Override allows optimistic updates from login/logout actions before the
  // useUserMe query refetches.
  const [override, setOverride] = useState<AuthStatus>(null);
  const [hasOverride, setHasOverride] = useState(false);
  const userMeQuery = useUserMe();

  // Derive auth status directly from query data (no useEffect delay).
  // - data is a User object when authenticated
  // - data is null when the query succeeds but user is not authenticated
  // - data is undefined while the query is still pending
  let derived: AuthStatus;
  if (userMeQuery.data) {
    derived = true;
  } else if (userMeQuery.data === null) {
    derived = false;
  } else {
    derived = null; // still loading
  }

  // Use override only while query is still catching up.
  const isAuthenticated = hasOverride ? override : derived;

  const setIsAuthenticated: React.Dispatch<React.SetStateAction<AuthStatus>> =
    useCallback((value: React.SetStateAction<AuthStatus>) => {
      setOverride(value);
      setHasOverride(true);
    }, []);

  const authState = useMemo<
    [AuthStatus, React.Dispatch<React.SetStateAction<AuthStatus>>]
  >(
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
