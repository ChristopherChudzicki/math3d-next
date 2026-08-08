import { test, expect } from "vitest";

test("runs under workerd with HTMLRewriter available", () => {
  expect(typeof HTMLRewriter).toBe("function");
});
