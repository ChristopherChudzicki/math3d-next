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

/**
 * Wait until the app has settled: no `[aria-busy="true"]` element remains and
 * the `["me"]` auth query is no longer `pending`.
 *
 * Prefer awaiting a positive observable at the assertion instead — `findBy*`
 * (which is `getBy*` + `waitFor`) names what's missing when it times out. Use
 * this helper only for an **async-gated negative assertion** that has no
 * natural positive anchor to await first, e.g.:
 *
 *   await waitForAppReady(queryClient);
 *   expect(screen.queryByRole("dialog")).toBeNull();
 *
 * A bare `queryBy*` after a synchronous render can pass because nothing has
 * rendered *yet*, not because the app is correct; anchoring on "app ready"
 * before asserting absence prevents that false-green.
 */
export const waitForAppReady = async (queryClient: QueryClient) => {
  await waitFor(
    () => {
      const busy = document.querySelector('[aria-busy="true"]');
      if (busy !== null) {
        throw new Error("Some elements are still loading.");
      }
    },
    { timeout: 2000 },
  );
  await waitFor(
    () => {
      const meState = queryClient.getQueryState(["me"]);
      if (meState?.status === "pending") {
        throw new Error("User me query not yet resolved");
      }
    },
    { timeout: 3000 },
  );
};

/**
 * Render the app using a MemoryRouter instead of a BrowserRouter.
 * Optionally, provide an initial route.
 *
 * Returns synchronously: waiting is co-located with assertions (`findBy*` /
 * explicit `waitFor`), not hoisted into setup. See {@link waitForAppReady} for
 * the one case (async-gated negative assertions) where an explicit settle is
 * still the right tool.
 */
const renderTestApp = (
  initialRoute: InitialEntry = "/",
  { isAuthenticated = false } = {},
) => {
  const initialEntries: InitialEntry[] = [initialRoute];
  const store = getStore();
  // Disable retries so error-state behavior (e.g. a 404 surfacing) settles
  // immediately; the production client retries some statuses with backoff, which
  // would otherwise stall tests well past their timeouts.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
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

  const location = {
    get current() {
      return router.state.location;
    },
  };

  return { result, store, location, user, router, queryClient };
};

export default renderTestApp;
