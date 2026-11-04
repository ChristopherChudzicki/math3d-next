import { describe, expect, test } from "vitest";
import { colorExprParams } from "./colorExprParams";

describe("colorExprParams", () => {
  test.each([
    {
      args: ["explicit", ["s", "t"]],
      expected: ["s", "t", "z"],
      note: "an explicit surface's params are its x and y",
    },
    {
      args: ["explicit", ["x", "z"]],
      expected: ["x", "z", "\\$z"],
      note: "a surface param takes a coordinate's name",
    },
    {
      args: ["parametric", ["u", "v"]],
      expected: ["x", "y", "z", "u", "v"],
      note: "no clash",
    },
    {
      args: ["parametric", ["x", "y"]],
      expected: ["\\$x", "\\$y", "z", "x", "y"],
      note: "surface params win over coordinates",
    },
    {
      args: ["parametric", ["u", "v"], ["\\$x", "\\$y", "z", "x", "y"]],
      expected: ["x", "y", "z", "u", "v"],
      note: "a stand-in for a clash clears with the clash",
    },
    {
      args: ["explicit", ["x", "y"], ["x", "y", "\\$z"]],
      expected: ["x", "y", "\\$z"],
      note: "a legacy stand-in sticks",
    },
    {
      args: ["parametric", ["x", "y"], ["x", "y", "\\$z", "u", "v"]],
      expected: ["\\$x", "\\$y", "\\$z", "x", "y"],
      note: "a legacy stand-in and clashes together",
    },
  ] as const)("$note", ({ args, expected }) => {
    const [kind, surfaceParams, previous] = args;
    expect(
      colorExprParams(kind, [...surfaceParams], previous && [...previous]),
    ).toEqual(expected);
  });

  test("surface params are copied verbatim and compared trimmed", () => {
    expect(colorExprParams("explicit", ["x", " z"])).toEqual([
      "x",
      " z",
      "\\$z",
    ]);
  });
});
