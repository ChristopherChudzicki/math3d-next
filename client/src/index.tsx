// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "antd/dist/antd.min.css";
import "./index.css";

import * as math from "mathjs";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./app";
import { getStore } from "./store/store";

window.math = math;

const container = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

const store = getStore();
// @ts-expect-error for debugging
window.store = store;

root.render(<App store={store} />);
