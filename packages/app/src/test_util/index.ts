import {
  act,
  fireEvent,
  prettyDOM,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import user from "@testing-library/user-event";
import { makeItem } from "./factories";

import renderTestApp from "./renderTestApp";

export * from "./test_util";
export {
  act,
  fireEvent,
  makeItem,
  prettyDOM,
  screen,
  user,
  waitFor,
  within,
  renderTestApp,
};
