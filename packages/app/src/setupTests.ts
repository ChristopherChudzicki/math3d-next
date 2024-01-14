import "test_util/network_polyfills";
import { server } from "@math3d/mock-api";

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

import failOnConsole from "jest-fail-on-console";

failOnConsole();

/**
 * For the JSDOM tests, we need to mock at least Mathbox, since it relies on a
 * bunch of WebGL APIs that are not supported.
 *
 * We might as well do this mocking at the mathbox-react level: At most, we will
 * assert that mathbox-react is getting the correct props.
 */
vitest.mock("mathbox-react", () =>
  vi.importActual("@/__mocks__/mathbox-react"),
);

/**
 * JSDOM does not support enough ShadowDOM for MathLive to function properly, so
 * this mocks it with a textarea.
 */
vitest.mock("./util/components/MathLive/MathField");

vitest.mock("mathlive", () => vi.importActual("@/__mocks__/mathlive"));

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
});
beforeEach(() => {
  localStorage.clear();
});
afterEach(() => {
  server.resetHandlers();
});
afterAll(() => server.close());
