// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "antd/dist/antd.min.css";
import "./index.css";

import { createTheme } from "@mui/material/styles";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient } from "@tanstack/react-query";

import AppRoutes from "./app";
import { getStore } from "./store/store";

let setup = Promise.resolve();

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { worker } = require("./test_util/msw/browser");
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { seedDb } = require("./test_util");
  seedDb.withFixtures();
  setup = worker.start();
}

setup.then(() => {
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
