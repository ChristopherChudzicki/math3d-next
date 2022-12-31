import type * as math from "mathjs";
import { getDependencies } from "mathjs-utils";

const domainFuncs2 = (value: math.MathNode): [number, number] => {
  if (value.type !== "ArrayNode") {
    throw new Error("Expected an ArrayNode");
  }
  if (!value.items.every((n) => n.type === "FunctionAssignmentNode")) {
    throw new Error("Expected an array of FunctionAssignmentNode");
  }
  if (value.items.length !== 2) {
    throw new Error("Expected an array of 2 FunctionAssignmentNode");
  }
  const [f1, f2] = value.items as math.FunctionAssignmentNode[];
  /**
   * Not a mistake:
   *   The expression is a function of 2 variables, f(p1, p2)
   *   The domain is an array of two single-variable functions, [f1(p2), f2(p1)]
   *   only one of which should actually depend on its argument
   */
  const [p1] = f2.params;
  const [p2] = f1.params;
  const [deps1, deps2] = [f1.expr, f2.expr].map(getDependencies);

  if (deps1.has(p2) && deps2.has(p1)) {
    throw new Error(
      "Cyclic Dependency: Both domain functions depend on each other."
    );
  }

  if (deps1.has(p2)) {
    return [1, 0];
  }
  return [0, 1];
};

const domainFuncs = {
  2: domainFuncs2,
};

export { domainFuncs };
