import { describe, it, expect } from "vitest";
import * as math from "mathjs";
import { SimplerMathJsParser } from "../adapter";
import { getAssignmentCycles } from "./util";

const { parse } = new SimplerMathJsParser(math);

describe("getAssignmentCycles", () => {
  it("detects cycles", () => {
    const a = parse("a = b^2 + x");
    const b = parse("b = c^2 + y");
    const c = parse("c = a^2 + z");
    const x = parse("x = y^2");
    const y = parse("y = z^2");
    const z = parse("z = 5");
    const s = parse("s = t");
    const t = parse("t = s^2");
    const cycles = getAssignmentCycles([a, b, c, x, y, z, s, t]);
    expect(cycles).toStrictEqual([
      [a, c, b],
      [s, t],
    ]);
  });
});
