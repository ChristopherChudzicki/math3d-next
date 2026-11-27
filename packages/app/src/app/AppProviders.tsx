import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Provider } from "react-redux";
import { RouterProvider } from "@tanstack/react-router";
import type { AnyRouter } from "@tanstack/react-router";
import { AppStore } from "@/store/store";
import { NotificationsProvider } from "@/ui/Notifications/NotificationsContext";
import NotificationsDisplay from "@/ui/Notifications/NotificationsDisplay";
import ToastHost from "@/ui/Toast/ToastHost";

interface AppProps {
  store: AppStore;
  queryClient: QueryClient;
  router: AnyRouter;
}

const AppProviders: React.FC<AppProps> = ({ store, queryClient, router }) => (
  <Provider store={store}>
    <NotificationsProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
        <NotificationsDisplay />
        <ToastHost />
      </QueryClientProvider>
    </NotificationsProvider>
  </Provider>
);

export default AppProviders;
