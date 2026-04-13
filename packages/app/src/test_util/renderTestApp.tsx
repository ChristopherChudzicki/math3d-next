import { render, waitFor } from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import React from "react";
import { createMemoryRouter } from "react-router";
import { getStore } from "@/store/store";

import { InitialEntry } from "history";
import { QueryClient } from "@tanstack/react-query";
import { mockAuth, seedDb } from "@math3d/mock-api";
import AppProviders from "@/AppProviders";
import routes from "@/routes";

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
    // Set the mock API's current user to simulate session auth
    mockAuth.setCurrentUser(user.id);
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

  // Wait for the user-me query to resolve so auth status is reflected in
  // the UI before test assertions run.
  await waitFor(
    () => {
      const meState = queryClient.getQueryState(["me"]);
      if (!meState || meState.status === "pending") {
        throw new Error("User me query not yet resolved");
      }
    },
    { timeout: 3000 },
  );

  const location = {
    get current() {
      return router.state.location;
    },
  };

  return { result, store, location, user };
};

export default renderTestApp;
