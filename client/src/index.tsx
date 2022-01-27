import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// bootstrap just for utility classes
import "bootstrap/dist/css/bootstrap-utilities.css";
import "antd/dist/antd.css";
import "./index.css";
import * as routes from "./routes";
import { store } from "./app/store";
import * as math from "mathjs";

window.math = math;

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
          <Route path="/">
            <Route path="/:sceneId" element={<routes.MainPage />} />
            <Route path="" element={<routes.MainPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);
