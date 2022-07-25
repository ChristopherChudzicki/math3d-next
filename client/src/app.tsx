import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router-dom";
import { AppStore } from "store/store";

import * as routes from "./routes";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
}

const AppRoutes: React.FC<AppProps> = ({ store, queryClient }) => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/">
          <Route path="/:sceneId" element={<routes.MainPage />} />
          <Route path="" element={<routes.MainPage />} />
        </Route>
      </Routes>
    </QueryClientProvider>
  </Provider>
);

export default AppRoutes;
