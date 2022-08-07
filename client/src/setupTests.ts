import failOnConsole from "jest-fail-on-console";

import { seedDb } from "test_util";
import { server } from "./test_util/msw/server";

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

failOnConsole({
  silenceMessage: (error) => {
    return [/ForwardRef\(TabNavList\)/].some((regex) => regex.test(error));
  },
});

/**
 * Jest does not support enough ShadowDOM for MathLive to function properly, so
 * this mocks it with a textarea.
 */
jest.mock("./util/components/MathLive/MathField");

/**
 * And since we're not using a ShadowDOM, we can't change the ShadowDOM styles.
 */
jest.mock("./util/hooks/useShadowStylesheet");

jest.mock("./util/components/TextareaAutoWidthHeight/TextMeasurer");

/**
 * API mocking for our tests.
 * Reset any test-specific handlers between tests.
 */
beforeAll(() => {
  server.listen();
  seedDb.withFixtures();
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
