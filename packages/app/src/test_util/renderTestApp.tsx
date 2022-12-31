import { render, waitFor } from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { getStore } from "@/store/store";

import { InitialEntry } from "history";
import { QueryClient } from "@tanstack/react-query";
import AppRoutes from "../app";

const waitForNotBusy = () =>
  waitFor(
    () => {
      const busy = document.querySelector('[aria-busy="true"]');
      if (busy !== null) {
        throw new Error("Some elements are still loading.");
      }
    },
    { timeout: 2000 }
  );

/**
 * Render the app using a MemoryRouter instead of a BrowserRouter.
 * Optionally, provide an initial route.
 */
const renderTestApp = async (
  initialRoute: InitialEntry = "/",
  { waitForReady = true } = {}
) => {
  const initialEntries: InitialEntry[] = [initialRoute];
  const store = getStore();
  const queryClient = new QueryClient();
  const theme = createTheme({
    transitions: {
      create: () => "none",
      /**
       * This prevents our Popover from using transitions. Transitions in our
       * Popover seemed to be causing un-acted state updates in our tests.
       */
      duration: { standard: 0 },
    },
  });
  const result = render(
    <React.StrictMode>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes queryClient={queryClient} store={store} theme={theme} />
      </MemoryRouter>
    </React.StrictMode>
  );
  if (waitForReady) {
    await waitForNotBusy();
  }
  return { result, store };
};

export default renderTestApp;
