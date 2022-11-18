import { flatProduct, permutations } from "./test_util";

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

describe("flatProduct", () => {
  it("Returns the flattened cartesian product of two arrays objects", () => {
    const arr1 = [{ a: 1 }, { a: 2 }];
    const arr2 = [{ b: 10 }, { b: 20 }];
    const arr3 = [{ c: 100 }, { c: 200 }];

    const result = flatProduct(arr1, arr2, arr3);

    expect(result).toStrictEqual([
      { a: 1, b: 10, c: 100 },
      { a: 1, b: 10, c: 200 },
      { a: 1, b: 20, c: 100 },
      { a: 1, b: 20, c: 200 },
      { a: 2, b: 10, c: 100 },
      { a: 2, b: 10, c: 200 },
      { a: 2, b: 20, c: 100 },
      { a: 2, b: 20, c: 200 },
    ]);

    expect(result[0].a).toBe(1);
    expect(result[0].b).toBe(10);
    expect(result[0].c).toBe(100);
  });
});
