// JS-Dom does not include fetch.
// See https://github.com/mswjs/examples/blob/master/examples/with-jest/jest.setup.js
import "whatwg-fetch";

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import failOnConsole from "jest-fail-on-console";

import { seedDb } from "@/test_util";
import { server } from "./test_util/msw/server";

failOnConsole({
  silenceMessage: (error) => {
    return [/ForwardRef\(TabNavList\)/].some((regex) => regex.test(error));
  },
});

/**
 * Jest does not support enough ShadowDOM for MathLive to function properly, so
 * this mocks it with a textarea.
 */
vitest.mock("./util/components/MathLive/MathField");

/**
 * And since we're not using a ShadowDOM, we can't change the ShadowDOM styles.
 */
vitest.mock("./util/hooks/useShadowStylesheet");

vitest.mock("./util/components/TextareaAutoWidthHeight/TextMeasurer");

/**
 * API mocking for our tests.
 * Reset any test-specific handlers between tests.
 */
beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  seedDb.withFixtures();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
