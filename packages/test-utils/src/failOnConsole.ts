/* eslint-disable no-console -- this module's job is to intercept console */
import { afterEach, beforeEach } from "vitest";
import { format } from "node:util";

/**
 * Console methods that cause a test to fail when called unexpectedly.
 *
 * We deliberately mirror only the defaults of jest-fail-on-console /
 * vitest-fail-on-console (fail on `error` and `warn`); the projects only ever
 * used the no-options behavior, so the rest of those libraries' config surface
 * is intentionally not reproduced here.
 */
type GuardedMethod = "error" | "warn";

const hint = (method: GuardedMethod): string =>
  `Expected test not to call console.${method}(). If the call is expected, ` +
  `mock it explicitly, e.g. ` +
  `vi.spyOn(console, "${method}").mockImplementation(() => {}), and assert on it.`;

interface ConsoleGuard {
  /** Replace the console method with the recording guard and reset state. */
  install: () => void;
  /** Restore the original console method. */
  restore: () => void;
  /** Throw if any unexpected call was recorded since the last install/flush. */
  flush: () => void;
}

/**
 * Builds an installable guard around a single console method. Exposed
 * (separately from {@link failOnConsole}) so the throwing behavior can be unit
 * tested without relying on a failing test.
 */
export const createConsoleGuard = (method: GuardedMethod): ConsoleGuard => {
  const original = console[method];
  let recorded: { message: string; stack: string }[] = [];

  const guard = (...args: unknown[]): void => {
    const stack = new Error().stack ?? "";
    recorded.push({
      message: format(...args),
      // Drop the leading "Error" line so the stack points at the caller.
      stack: stack.slice(stack.indexOf("\n") + 1),
    });
  };

  return {
    install: () => {
      console[method] = guard;
      recorded = [];
    },
    restore: () => {
      console[method] = original;
    },
    flush: () => {
      if (recorded.length === 0) return;
      const calls = recorded;
      recorded = [];
      const detail = calls
        .map(({ message, stack }) => `${message}\n${stack}`)
        .join("\n\n");
      throw new Error(`${hint(method)}\n\n${detail}`);
    },
  };
};

/**
 * Fail the current test if it logs to `console.error` or `console.warn`.
 *
 * Call once from a test setup file. Tests that legitimately expect such output
 * should mock the method themselves (e.g.
 * `vi.spyOn(console, "warn").mockImplementation(() => {})`); that spy shadows
 * the guard installed here, so those tests pass.
 */
const failOnConsole = (): void => {
  (["error", "warn"] as const).forEach((method) => {
    const guard = createConsoleGuard(method);
    beforeEach(guard.install);
    afterEach(() => {
      guard.restore();
      guard.flush();
    });
  });
};

export default failOnConsole;
