import type { QueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router-dom";
import { AppStore } from "@/store/store";

import * as routes from "./routes";

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
            <Route path="/:sceneId" element={<routes.MainPage />} />
            <Route path="" element={<routes.MainPage />} />
          </Route>
        </Routes>
      </ThemeProvider>
    </QueryClientProvider>
  </Provider>
);

export default AppRoutes;
