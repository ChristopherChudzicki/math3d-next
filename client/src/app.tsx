import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import * as routes from "./routes";
import type { AppStore } from "./store/store";

interface Props {
  store: AppStore;
}

const App: React.FC<Props> = ({ store }) => (
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
  </React.StrictMode>
);

export default App;
