import {
  act,
  fireEvent,
  prettyDOM,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import user from "@testing-library/user-event";
import { makeItem } from "./makeItem";

import renderTestApp from "./renderTestApp";
import { seedDb } from "./msw/db";
import { sceneKeys } from "./msw/fixtures";

export * from "./test_util";
export {
  seedDb,
  sceneKeys,
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
