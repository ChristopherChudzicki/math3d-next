import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MathScope from "util/MathScope";

import { MathContext } from "./features/sceneControls/mathItems";
import * as routes from "./routes";
import type { AppStore } from "./store/store";

interface Props {
  store: AppStore;
  mathScope: MathScope;
}

const App: React.FC<Props> = ({ store, mathScope }) => (
  <React.StrictMode>
    <Provider store={store}>
      {/**
       * MathScope doesn't necessary need to be so high in the tree, but it
       * doesn't hurt since the instance value never change.
       */}
      <MathContext.Provider value={mathScope}>
        <BrowserRouter>
          <Routes>
            <Route path="/">
              <Route path="/:sceneId" element={<routes.MainPage />} />
              <Route path="" element={<routes.MainPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </MathContext.Provider>
    </Provider>
  </React.StrictMode>
);

export default App;
