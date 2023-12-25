import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { Outlet, Route, Routes } from "react-router-dom";
import { AppStore } from "@/store/store";

import MainPage from "./pages/MainPage";
import LoginPage from "./pages/auth/LoginPage";
import LogoutPage from "./pages/auth/LogoutPage";
import { AuthStatusProvider } from "./features/auth";
import RegistrationPage from "./pages/auth/RegistrationPage";
import AccountActivationPage from "./pages/auth/ActivationPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";
import ResetPasswordConfirmPage from "./pages/auth/ResetPasswordConfirmPage";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
  theme: Theme;
}

const AppRoutes: React.FC<AppProps> = ({ store, queryClient, theme }) => (
  <AuthStatusProvider>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <Routes>
            <Route
              path="/:sceneKey?"
              element={
                <>
                  <MainPage />
                  <Outlet />
                </>
              }
            >
              <Route path="auth/login" element={<LoginPage />} />
              <Route path="auth/logout" element={<LogoutPage />} />
              <Route path="auth/register" element={<RegistrationPage />} />
              <Route
                path="auth/activate-account"
                element={<AccountActivationPage />}
              />
              <Route
                path="auth/reset-password"
                element={<ResetPasswordPage />}
              />
              <Route
                path="auth/reset-password/confirm"
                element={<ResetPasswordConfirmPage />}
              />
            </Route>
          </Routes>
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </AuthStatusProvider>
);

export default AppRoutes;
