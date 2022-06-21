import {
  act,
  fireEvent,
  prettyDOM,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import user from "@testing-library/user-event";
import { makeItem } from "features/sceneControls/mathItems/util";

import IntegrationTest from "./IntegrationTest";
import patchConsoleError from "./patchConsoleError";

export * from "./test_util";
export {
  act,
  fireEvent,
  IntegrationTest,
  makeItem,
  patchConsoleError,
  prettyDOM,
  screen,
  user,
  waitFor,
  within,
};
