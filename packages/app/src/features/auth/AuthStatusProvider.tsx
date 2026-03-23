import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "@math3d/api";
import invariant from "tiny-invariant";

type AuthStatus = boolean | null; // null = loading/unknown

const AuthStatusContext = createContext<
  [AuthStatus, React.Dispatch<React.SetStateAction<AuthStatus>>]
>([null, () => invariant(false, "AuthContext not initialized")]);

const AuthStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<AuthStatus>(null);
  const sessionQuery = useSession();

  // Derive auth status from session query result
  useEffect(() => {
    if (sessionQuery.data && sessionQuery.data.status === 200) {
      setIsAuthenticated(true);
    } else if (sessionQuery.data === null || sessionQuery.isError) {
      setIsAuthenticated(false);
    }
  }, [sessionQuery.data, sessionQuery.isError]);

  const authState = useMemo<
    [AuthStatus, React.Dispatch<React.SetStateAction<AuthStatus>>]
  >(() => [isAuthenticated, setIsAuthenticated], [isAuthenticated]);
  return (
    <AuthStatusContext.Provider value={authState}>
      {children}
    </AuthStatusContext.Provider>
  );
};

const useAuthStatus = () => useContext(AuthStatusContext);

export { AuthStatusProvider, useAuthStatus };
export type { AuthStatus };
