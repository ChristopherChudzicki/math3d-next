import { describe, it, expect } from "vitest";
import toLaTeX from "./toLaTeX";

describe("toLaTeX", () => {
  it("Converts scalar/primitive values correctly", () => {
    expect(toLaTeX(1.234)).toBe("1.234");
    expect(toLaTeX({ re: 1.23, im: 4.56 })).toBe("1.23 + 4.56i");
    expect(toLaTeX(true)).toBe("true");
    expect(toLaTeX(false)).toBe("false");
  });

  it("Converts 1d and 2d arrays", () => {
    expect(toLaTeX([1, 2, 3])).toBe("[1, 2, 3]");
    expect(
      toLaTeX([
        [1, 2],
        [3, 4],
      ]),
    ).toBe(`\\begin{bmatrix}
1 & 2 \\\\
3 & 4
\\end{bmatrix}`);
  });

  it("Converts unsupported values to null", () => {
    expect(toLaTeX(null)).toBe(null);
    expect(toLaTeX(undefined)).toBe(null);
    expect(toLaTeX({})).toBe(null);
    expect(toLaTeX({ re: 1.23 })).toBe(null);
    expect(toLaTeX({ im: 1.23 })).toBe(null);
    expect(toLaTeX(() => 1)).toBe(null);
    expect(toLaTeX([[[1]]])).toBe(null);
  });
});
