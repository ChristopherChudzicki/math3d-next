import { test, expect } from "vitest";
import permutations from "./permutations";

test("permutations(...) returns all permutations of a list", () => {
  expect(permutations(["a", "b", "c"])).toStrictEqual([
    ["a", "b", "c"],
    ["a", "c", "b"],
    ["b", "a", "c"],
    ["b", "c", "a"],
    ["c", "a", "b"],
    ["c", "b", "a"],
  ]);

  expect(permutations([[1], [2]])).toStrictEqual([
    [[1], [2]],
    [[2], [1]],
  ]);
});
