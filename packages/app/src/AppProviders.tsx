import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router";
import type { RouterProviderProps } from "react-router";
import { AppStore } from "@/store/store";
import { NotificationsProvider } from "./features/notifications/NotificationsContext";
import NotificationsDisplay from "./features/notifications/NotificationsDisplay";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
  router: RouterProviderProps["router"];
}

const AppProviders: React.FC<AppProps> = ({ store, queryClient, router }) => (
  <Provider store={store}>
    <NotificationsProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <NotificationsDisplay />
      </QueryClientProvider>
    </NotificationsProvider>
  </Provider>
);

export default AppProviders;
