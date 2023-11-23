import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router-dom";
import { AppStore } from "@/store/store";

import * as pages from "./pages";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
  theme: Theme;
}

const AppRoutes: React.FC<AppProps> = ({ store, queryClient, theme }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <Routes>
          <Route path="/">
            <Route path="/:sceneKey" element={<pages.MainPage />} />
            <Route path="" element={<pages.MainPage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);

export default AppRoutes;
