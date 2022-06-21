import { render } from "@testing-library/react";
import { MathItem } from "configs";
import { keyBy } from "lodash";
import React from "react";
import { getInitialState, getStore, RootState } from "store/store";
import MathScope from "util/MathScope";
import { getLatexParser } from "util/parsing";

import App from "../app";

class IntegrationTest {
  private storePatch: Partial<RootState> = {};

  private hasRendered = false;

  private assertNotRendered = (msg: string) => {
    if (this.hasRendered) {
      throw new Error(msg);
    }
  };

  patchMathItems = (items: MathItem[]): void => {
    this.assertNotRendered(
      "patchMathItems cannot be called after initial render."
    );
    const patch = keyBy(items, (item) => item.id);
    this.storePatch.mathItems = patch;
  };

  patchStore = (patch: Partial<RootState>) => {
    this.assertNotRendered("patchStore cannot be called after initial render.");
    this.storePatch = patch;
  };

  render = () => {
    const state = { ...getInitialState(), ...this.storePatch };
    const store = getStore({ preloadedState: state });
    const parser = getLatexParser();
    const mathScope = new MathScope(parser);
    const result = render(<App store={store} mathScope={mathScope} />);
    return { result, mathScope, store };
  };
}

export default IntegrationTest;
