import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * A request-mocking server for use in NodeJS, e.g., integration tests.
 */
export const server = setupServer(...handlers);
