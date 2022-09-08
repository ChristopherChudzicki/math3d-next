// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "./globals.css";
import "./index.css";

import { createTheme } from "@mui/material/styles";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";

import AppRoutes from "./app";
import { getStore } from "./store/store";

const prepare = async () => {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { worker } = await import("./test_util/msw/browser");
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const { seedDb } = await import("./test_util");
    seedDb.withFixtures();
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
  const queryClient = new QueryClient();
  const theme = createTheme();

  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <AppRoutes queryClient={queryClient} store={store} theme={theme} />
      </BrowserRouter>
    </React.StrictMode>
  );
});
