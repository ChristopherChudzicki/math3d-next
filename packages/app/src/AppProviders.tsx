import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router";
import type { RouterProviderProps } from "react-router";
import { AppStore } from "@/store/store";
import { AuthStatusProvider } from "./features/auth";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
  theme: Theme;
  router: RouterProviderProps["router"];
}

const AppProviders: React.FC<AppProps> = ({
  store,
  queryClient,
  router,
  theme,
}) => (
  <AuthStatusProvider>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </Provider>
  </AuthStatusProvider>
);

export default AppProviders;
