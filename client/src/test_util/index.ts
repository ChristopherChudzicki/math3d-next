import user from "@testing-library/user-event";
import {
  screen,
  within,
  prettyDOM,
  waitFor,
  act,
  fireEvent,
} from "@testing-library/react";
import { makeItem } from "features/sceneControls/mathItems/util";
import IntegrationTest from "./IntegrationTest";
import patchConsoleError from "./patchConsoleError";

export * from "./test_util";
export {
  IntegrationTest,
  makeItem,
  user,
  screen,
  within,
  act,
  prettyDOM,
  waitFor,
  fireEvent,
  patchConsoleError,
};
