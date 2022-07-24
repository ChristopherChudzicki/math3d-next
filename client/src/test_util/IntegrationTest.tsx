import { render } from "@testing-library/react";
import { MathItem, MathItemType } from "configs";
import { keyBy } from "lodash";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { getInitialState, getStore } from "store/store";
import type { RootState } from "store/store";
import { makeItem } from "test_util";

import { Provider } from "react-redux";
import { InitialEntry } from "history";
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
    const result = render(
      <React.StrictMode>
        <Provider store={store}>
          <MemoryRouter>
            <AppRoutes />
          </MemoryRouter>
        </Provider>
      </React.StrictMode>
    );
    return { result, store };
  };
}

export default IntegrationTest;

/**
 * Render the app using a MemoryRouter instead of a BrowserRouter.
 * Optionally, provide an initial route.
 */
const renderTestApp = (initialRoute: InitialEntry = "/") => {
  const initialEntries: InitialEntry[] = [initialRoute];
  const store = getStore();
  const result = render(
    <React.StrictMode>
      <Provider store={store}>
        <MemoryRouter initialEntries={initialEntries}>
          <AppRoutes />
        </MemoryRouter>
      </Provider>
    </React.StrictMode>
  );
  return { result, store };
};

export { renderTestApp };
