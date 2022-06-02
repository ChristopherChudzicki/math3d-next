import {
  findNestedExpression,
  findTexCommand,
  replaceAllTexCommand,
} from "./util";

describe("findNestedExpression", () => {
  test.each([
    {
      expected: { start: 2, end: 27 },
      start: 0,
    },
    {
      expected: { start: 28, end: 33 },
      start: 27,
    },
  ])("finding balanced expressions", ({ expected, start }) => {
    const opener = "<<";
    const closer = ">>";
    //            0         1         2         3
    //            0123456789012345678901234567890123456789
    const text = "a << hello << a >> << >> >> << >> b";
    expect(findNestedExpression(text, opener, closer, start)).toStrictEqual(
      expected
    );
  });

  test("finding balanced expressions with unclosed, unopened delimiters", () => {
    const opener = "<<";
    const closer = ">>";
    //            0         1         2         3
    //            0123456789012345678901234567890123456789
    const text = ">> << >> >> <<";
    const expected = { start: 3, end: 8 };
    expect(findNestedExpression(text, opener, closer, 0)).toStrictEqual(
      expected
    );
  });

  test("with no matches", () => {
    const opener = "<<";
    const closer = ">>";
    //            0         1         2         3
    //            0123456789012345678901234567890123456789
    const text = ">> rats >> << cats";
    expect(findNestedExpression(text, opener, closer, 0)).toStrictEqual(null);
  });

  test("with opener and closer of unequal lengths", () => {
    const opener = "[[[";
    const closer = ">";
    //            0         1         2         3
    //            0123456789012345678901234567890123456789
    const text = "cats [[[ rats [[[]]] > [[[ >> bats";
    const expected = { start: 5, end: 29 };
    expect(findNestedExpression(text, opener, closer, 0)).toStrictEqual(
      expected
    );
  });
});

describe("findTexCommand", () => {
  it("finds the first instance of command", () => {
    const text =
      "The quick \\dog{barkbark} jumps over \\dog{woofwoof}{meow} the lazy fox.";
    expect(findTexCommand(text, "dog", 1)).toStrictEqual({
      start: 10,
      end: 24,
      name: "dog",
      params: ["barkbark"],
    });
  });

  it("finds the first instance of multi-param command", () => {
    const text =
      "The quick \\frac{barkbark}{woofwoof} jumps over \\frac{purrpurr}{meow} the lazy fox.";
    expect(findTexCommand(text, "frac", 2)).toStrictEqual({
      start: 10,
      end: 35,
      name: "frac",
      params: ["barkbark", "woofwoof"],
    });
  });

  it("Returns null if no matches", () => {
    const text = "The quick dog and the lazy fox.";
    expect(findTexCommand(text, "frac", 2)).toBe(null);
  });

  it.each([
    {
      text: "The quick \\dog{barkbark}{ jumps",
      expected: /Too few/,
    },
    {
      text: "The quick \\dog{barkbark} jumps",
      expected: /Start character should/,
    },
  ])("Throws an error if command has too few params", ({ text, expected }) => {
    const shouldThrow = () => findTexCommand(text, "dog", 2);
    expect(shouldThrow).toThrow(expected);
  });
});
