// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "antd/dist/antd.min.css";
import "./index.css";

import * as math from "mathjs";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import { Provider } from "react-redux";
import AppRoutes from "./app";
import { getStore } from "./store/store";

if (process.env.NODE_ENV === "development") {
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { worker } = require("./test_util/msw/browser");
  // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
  const { seedDb } = require("./test_util");
  seedDb.withFixtures();
  worker.start();
}

window.math = math;

const container = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

const store = getStore();

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
