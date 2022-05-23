import React from "react";
import { render } from "@testing-library/react";
import { RootState, getStore, getInitialState } from "store/store";
import App from "../app";

class IntegrationTest {
  private storePatch: Partial<RootState> = {};

  patchStore = (patch: Partial<RootState>) => {
    this.storePatch = patch;
  };

  render = () => {
    const state = { ...getInitialState(), ...this.storePatch };
    const store = getStore({ preloadedState: state });
    const result = render(<App store={store} />);
    return [result];
  };
}

export default IntegrationTest;
