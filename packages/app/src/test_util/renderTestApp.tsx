import { render, waitFor } from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import React from "react";
import { createMemoryRouter } from "react-router";
import { getStore } from "@/store/store";

import { InitialEntry } from "history";
import { QueryClient } from "@tanstack/react-query";
import { API_TOKEN_KEY } from "@math3d/api";
import AppProviders from "@/AppProviders";
import routes from "@/routes";
import { seedDb } from "@math3d/mock-api";

const waitForNotBusy = () =>
  waitFor(
    () => {
      const busy = document.querySelector('[aria-busy="true"]');
      if (busy !== null) {
        throw new Error("Some elements are still loading.");
      }
    },
    { timeout: 2000 },
  );

/**
 * Render the app using a MemoryRouter instead of a BrowserRouter.
 * Optionally, provide an initial route.
 */
const renderTestApp = async (
  initialRoute: InitialEntry = "/",
  { waitForReady = true, isAuthenticated = false } = {},
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

  const user = isAuthenticated ? seedDb.withUser() : null;
  if (user) {
    localStorage.setItem(API_TOKEN_KEY, `"${user.auth_token}"`);
  }

  const router = createMemoryRouter(routes, { initialEntries });
  const result = render(
    <React.StrictMode>
      <AppProviders
        queryClient={queryClient}
        store={store}
        theme={theme}
        router={router}
      />
    </React.StrictMode>,
  );
  if (waitForReady) {
    await waitForNotBusy();
  }

  const location = {
    get current() {
      return router.state.location;
    },
  };

  return { result, store, location, user };
};

export default renderTestApp;
