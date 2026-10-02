import {
  fireEvent,
  prettyDOM,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { act } from "react";
import user from "@testing-library/user-event";

import renderTestApp, { waitForAppReady } from "./renderTestApp";
import countRequests from "./countRequests";

export * from "./test_util";
export {
  act,
  countRequests,
  fireEvent,
  prettyDOM,
  screen,
  user,
  waitFor,
  within,
  renderTestApp,
  waitForAppReady,
};
