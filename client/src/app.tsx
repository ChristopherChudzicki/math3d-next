import React from "react";
import { Route, Routes } from "react-router-dom";

import * as routes from "./routes";

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/">
      <Route path="/:sceneId" element={<routes.MainPage />} />
      <Route path="" element={<routes.MainPage />} />
    </Route>
  </Routes>
);

export default AppRoutes;
