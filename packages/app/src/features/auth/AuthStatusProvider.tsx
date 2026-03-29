import React, {
  createContext,
  useContext,
  useEffect,
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
  const [isAuthenticated, setIsAuthenticated] = useState<AuthStatus>(null);
  const userMeQuery = useUserMe();

  // Derive auth status from useUserMe query result
  useEffect(() => {
    if (userMeQuery.data) {
      setIsAuthenticated(true);
    } else if (userMeQuery.data === null) {
      setIsAuthenticated(false);
    }
  }, [userMeQuery.data]);

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
