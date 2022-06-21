// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "antd/dist/antd.min.css";
import "./index.css";

import * as math from "mathjs";
import React from "react";
import { createRoot } from "react-dom/client";

import App from "./app";
import { getStore } from "./store/store";
import MathScope from "./util/MathScope";
import { latexParser } from "./util/parsing";

window.math = math;

const mathScope = new MathScope({ parse: latexParser.parse });
// @ts-expect-error assign to window for debugging
window.mathScope = mathScope;

const container = document.getElementById("root");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);

const store = getStore();

root.render(<App store={store} mathScope={mathScope} />);
