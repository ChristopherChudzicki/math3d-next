// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

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
 * Suppress deprecration warnings from React due to antd
 * https://github.com/ant-design/ant-design/issues/31805
 */
const suppressFindDomNodeWarnings = () => {
  // eslint-disable-next-line
  const consoleError = console.error.bind(console);
  // eslint-disable-next-line
  console.error = (errObj, ...args) => {
    const suppresionEnvs = ["test"];
    if (
      suppresionEnvs.includes(process.env.NODE_ENV) &&
      args.includes("findDOMNode")
    ) {
      return;
    }
    consoleError(errObj, ...args);
  };
};

suppressFindDomNodeWarnings();
