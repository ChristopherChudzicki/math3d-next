import React, { createContext, useContext, useState } from "react";
import { API_TOKEN_KEY } from "@math3d/api";
import invariant from "tiny-invariant";

const AuthStatusContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>]
>([false, () => invariant(false, "AuthContext not initialized")]);

const AuthStatusProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const authState = useState(!!localStorage.getItem(API_TOKEN_KEY));
  return (
    <AuthStatusContext.Provider value={authState}>
      {children}
    </AuthStatusContext.Provider>
  );
};

const useAuthStatus = () => useContext(AuthStatusContext);

export { AuthStatusProvider, useAuthStatus };
