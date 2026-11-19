import { test, expect } from "vitest";
import { mathWithTransform } from "@math3d/custom-mathjs";
import { FUNCTION_ARITY } from "@math3d/parser";
import { inlineShortcuts } from "./options";

test("the parser applies every built-in function a shortcut produces", () => {
  const functionNames = Object.values(inlineShortcuts)
    .map((latex) => latex.match(/^\\(?:operatorname\{)?(\w+)\}?$/)?.[1])
    .filter(
      (name): name is string =>
        !!name &&
        typeof (mathWithTransform as Record<string, unknown>)[name] ===
          "function",
    );
  expect(functionNames).toContain("sin");
  expect(functionNames.filter((name) => !(name in FUNCTION_ARITY))).toEqual([]);
});
