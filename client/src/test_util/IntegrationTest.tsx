import { render, waitFor } from "@testing-library/react";
import { MathItem, MathItemType } from "configs";
import { keyBy } from "lodash";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { getInitialState, getStore } from "store/store";
import type { RootState } from "store/store";
import { makeItem } from "test_util";

import { InitialEntry } from "history";
import { QueryClient } from "@tanstack/react-query";
import AppRoutes from "../app";

type StorePatch = Partial<{
  [k in keyof RootState]: Partial<RootState[k]>;
}>;

const mergeStoreStates = (state: RootState, patch: StorePatch) => {
  const copy = { ...state };
  if (patch.mathItems) {
    copy.mathItems = { ...copy.mathItems, ...patch.mathItems };
  }
  return copy;
};

/**
 * @deprecated Prefer using `renderTestApp`
 */
class IntegrationTest {
  private storePatch: StorePatch = {};

  private hasRendered = false;

  private assertNotRendered = (msg: string) => {
    if (this.hasRendered) {
      throw new Error(msg);
    }
  };

  patchMathItemsInFolder = (
    items: MathItem[],
    { folder = makeItem(MathItemType.Folder) } = {}
  ): void => {
    this.assertNotRendered(
      "patchMathItemsInFolder cannot be called after initial render."
    );
    const mathItemsPatch: Partial<RootState["mathItems"]> = {
      items: keyBy([folder, ...items], (item) => item.id),
      order: {
        main: [folder.id],
        [folder.id]: items.map((item) => item.id),
        setup: [],
      },
    };
    this.storePatch.mathItems = mathItemsPatch;
  };

  patchStore = (patch: StorePatch) => {
    this.assertNotRendered("patchStore cannot be called after initial render.");
    this.storePatch = patch;
  };

  render = () => {
    const state = mergeStoreStates(getInitialState(), this.storePatch);
    const store = getStore({ preloadedState: state });
    const queryClient = new QueryClient();
    const result = render(
      <React.StrictMode>
        <MemoryRouter>
          <AppRoutes queryClient={queryClient} store={store} />
        </MemoryRouter>
      </React.StrictMode>
    );
    return { result, store };
  };
}

export default IntegrationTest;

const waitForNotBusy = () =>
  waitFor(() => {
    const busy = document.querySelector('[aria-busy="true"]');
    if (busy !== null) {
      throw new Error("Some elements are still loading.");
    }
  });

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
  const result = render(
    <React.StrictMode>
      <MemoryRouter initialEntries={initialEntries}>
        <AppRoutes queryClient={queryClient} store={store} />
      </MemoryRouter>
    </React.StrictMode>
  );
  if (waitForReady) {
    await waitForNotBusy();
  }
  return { result, store };
};

export { renderTestApp };
