import { render } from "@testing-library/react";
import { MathItem, MathItemType } from "configs";
import { keyBy } from "lodash";
import React from "react";
import { getInitialState, getStore } from "store/store";
import type { RootState } from "store/store";
import { makeItem } from "test_util";
import MathScope from "util/MathScope";
import { getLatexParser } from "util/parsing";

import App from "../app";

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
    const { mathScope } = state.mathItems;
    const result = render(<App store={store} />);
    return { result, mathScope, store };
  };
}

export default IntegrationTest;
