import { permutations } from "./test_util";

describe("permutations", () => {
  it("returns all permutations of a list", () => {
    const abc = ["a", "b", "c"];
    expect(permutations(abc)).toStrictEqual([
      ["a", "b", "c"],
      ["a", "c", "b"],
      ["b", "a", "c"],
      ["b", "c", "a"],
      ["c", "a", "b"],
      ["c", "b", "a"],
    ]);
  });
});
