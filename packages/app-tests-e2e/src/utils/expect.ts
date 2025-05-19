import { expect as baseExpect } from "@playwright/test";
import type { Locator } from "@playwright/test";

export { test } from "@playwright/test";

const expect = baseExpect.extend({
  async toHaveDescription(
    locator: Locator,
    expected: string | RegExp,
    options?: { timeout?: number },
  ) {
    const assertionName = "toHaveDescription";
    let pass: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matcherResult: any;
    try {
      await baseExpect(locator).toHaveAttribute(
        "aria-describedby",
        /.*/,
        options,
      );
      const describedBy = await locator.getAttribute("aria-describedby");
      const descriptor = await locator.page().locator(`id=${describedBy}`);
      await baseExpect(descriptor).toContainText(expected);
      pass = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      matcherResult = e.matcherResult;
      pass = false;
    }

    const message = pass
      ? () =>
          `${this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          })}\n\n` +
          `Locator: ${locator}\n` +
          `Expected: ${
            this.isNot ? "not" : ""
          } associated description ${this.utils.printExpected(expected)}\n${
            matcherResult
              ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
              : ""
          }`
      : () =>
          `${this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          })}\n\n` +
          `Locator: ${locator}\n` +
          `Expected: ${this.utils.printExpected(expected)}\n${
            matcherResult
              ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
              : ""
          }`;

    return {
      message,
      pass,
      name: assertionName,
      expected,
      actual: matcherResult?.actual,
    };
  },
  async toBeInvalid(locator: Locator, options?: { timeout?: number }) {
    const assertionName = "toBeInvalid";
    let pass: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let matcherResult: any;
    try {
      await baseExpect(locator).toHaveAttribute(
        "aria-invalid",
        "true",
        options,
      );
      pass = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      matcherResult = e.matcherResult;
      pass = false;
    }
    const message = pass
      ? () =>
          `${this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          })}\n\n` +
          `Locator: ${locator}\n` +
          `Expected: ${this.isNot ? "not" : ""} to be invalid\n${
            matcherResult
              ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
              : ""
          }`
      : () =>
          `${this.utils.matcherHint(assertionName, undefined, undefined, {
            isNot: this.isNot,
          })}\n\n` +
          `Locator: ${locator}\n` +
          `Expected: ${this.isNot ? "not" : ""} to be invalid\n${
            matcherResult
              ? `Received: ${this.utils.printReceived(matcherResult.actual)}`
              : ""
          }`;
    return {
      message,
      pass,
      name: assertionName,
      actual: matcherResult?.actual,
    };
  },
});

export { expect };
