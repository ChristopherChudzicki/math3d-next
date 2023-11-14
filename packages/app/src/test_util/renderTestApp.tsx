import { render, waitFor } from "@testing-library/react";
import { createTheme } from "@mui/material/styles";
import React, { useImperativeHandle } from "react";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { Location } from "react-router";
import { getStore } from "@/store/store";

import { InitialEntry } from "history";
import { QueryClient } from "@tanstack/react-query";
import invariant from "tiny-invariant";
import AppRoutes from "../app";

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

const LocationSpy = React.forwardRef<Location>((_props, ref) => {
  const location = useLocation();
  useImperativeHandle(ref, () => location, [location]);
  return null;
});
LocationSpy.displayName = "LocationSpy";

/**
 * Render the app using a MemoryRouter instead of a BrowserRouter.
 * Optionally, provide an initial route.
 */
const renderTestApp = async (
  initialRoute: InitialEntry = "/",
  { waitForReady = true } = {},
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

  // React router v6 does not provide a good way to view location in tests.
  const locationRef = { current: null as null | Location };
  const result = render(
    <React.StrictMode>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes queryClient={queryClient} store={store} theme={theme} />
        <LocationSpy
          ref={(loc) => {
            locationRef.current = loc;
          }}
        />
      </MemoryRouter>
    </React.StrictMode>,
  );
  if (waitForReady) {
    await waitForNotBusy();
  }

  invariant(locationRef.current, "LocationSpy was not mounted.");
  const location = locationRef as { current: Location };
  return { result, store, location };
};

export default renderTestApp;
