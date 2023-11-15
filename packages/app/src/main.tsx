// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "./globals.css";
import "./index.css";

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";
import math from "@math3d/custom-mathjs";
import { theme } from "./mui";

import AppRoutes from "./app";
import { getStore } from "./store/store";

window.math = math;

const prepare = async () => {
  if (import.meta.env.VITE_USE_MSW) {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { worker } = await import("./test_util/msw/browser");
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
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
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: Infinity,
      },
    },
  });

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AppRoutes queryClient={queryClient} store={store} theme={theme} />
      </BrowserRouter>
    </React.StrictMode>,
  );
});
