/* eslint-disable no-console -- this suite intentionally exercises console */
import { describe, expect, it } from "vitest";
import { createConsoleGuard } from "./failOnConsole";

describe("createConsoleGuard", () => {
  it("flush throws, naming the method, after an unexpected call", () => {
    const guard = createConsoleGuard("error");
    guard.install();
    console.error("boom");
    guard.restore();
    expect(() => guard.flush()).toThrow(/console\.error/);
  });

  it("flush does not throw when the method was not called", () => {
    const guard = createConsoleGuard("warn");
    guard.install();
    guard.restore();
    expect(() => guard.flush()).not.toThrow();
  });

  it("includes the formatted message in the failure", () => {
    const guard = createConsoleGuard("warn");
    guard.install();
    console.warn("missing %s", "value");
    guard.restore();
    expect(() => guard.flush()).toThrow(/missing value/);
  });

  it("restore reinstates the original console method", () => {
    const original = console.error;
    const guard = createConsoleGuard("error");
    guard.install();
    expect(console.error).not.toBe(original);
    guard.restore();
    expect(console.error).toBe(original);
  });
});
