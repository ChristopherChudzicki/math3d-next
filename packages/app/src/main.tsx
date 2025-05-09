import "./globals.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router-dom";
import math from "@math3d/custom-mathjs";
import { createQueryClient } from "./services/react-query/react-query";
import { theme } from "./mui";

import AppRoutes from "./AppProviders";
import { getStore } from "./store/store";
import routes from "./routes";

// @ts-expect-error Allow accessing math on window in dev for debugging
window.math = math;

const prepare = async () => {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MSW) {
    // eslint-disable-next-line import/no-extraneous-dependencies
    const { worker } = await import("@math3d/mock-api/browser");
    await worker.start();
  }
};

prepare().then(() => {
  const container = document.getElementById("root");
  if (!container) {
    throw new Error("Could not find root container.");
  }
  const root = createRoot(container);

  const store = getStore();
  if (import.meta.env.DEV) {
    // @ts-expect-error Allow accessing store on widnow in dev for debugging
    window.store = store;
  }
  const queryClient = createQueryClient();

  const router = createBrowserRouter(routes);

  root.render(
    <React.StrictMode>
      <AppRoutes
        queryClient={queryClient}
        store={store}
        theme={theme}
        router={router}
      />
    </React.StrictMode>,
  );
});
