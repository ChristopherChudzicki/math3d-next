import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * A request-mocking service worker for use in browser.
 */
export const worker = setupWorker(...handlers);
