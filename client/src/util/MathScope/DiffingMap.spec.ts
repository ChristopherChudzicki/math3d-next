import DiffingMap from "./DiffingMap";

describe("DiffingMap", () => {
  it("computes the map difference since instantiation", () => {
    const map = new Map([
      ["a", 0],
      ["b", 1],
      ["c", 2],
    ]);
    const diffingMap = new DiffingMap(map);

    diffingMap.set("b", 10);
    diffingMap.set("x", 23);
    diffingMap.set("y", 24);
    diffingMap.delete("c");

    const diff = diffingMap.getDiff();
    expect(diff).toStrictEqual({
      added: new Set(["x", "y"]),
      updated: new Set(["b"]),
      deleted: new Set(["c"]),
    });
  });

  it("returns the same diff until reset", () => {
    const map = new Map<string, number>();
    const diffingMap = new DiffingMap(map);

    diffingMap.set("cat", 1);

    const diff1 = diffingMap.getDiff();
    const diff2 = diffingMap.getDiff();
    diffingMap.resetDiff();
    const diff3 = diffingMap.getDiff();

    expect(diff1).toStrictEqual(diff2);
    expect(diff1).not.toStrictEqual(diff3);
  });

  it("counts add+update as add", () => {
    const map = new Map<string, number>();
    const diffingMap = new DiffingMap(map);

    diffingMap.set("a", 0);
    diffingMap.set("a", 10);

    expect(diffingMap.getDiff()).toStrictEqual({
      added: new Set(["a"]),
      updated: new Set([]),
      deleted: new Set([]),
    });
  });

  it("counts add+delete as nothing", () => {
    const map = new Map<string, number>();
    const diffingMap = new DiffingMap(map);

    diffingMap.set("a", 0);
    diffingMap.delete("a");

    expect(diffingMap.getDiff()).toStrictEqual({
      added: new Set([]),
      updated: new Set([]),
      deleted: new Set([]),
    });
  });

  it("counts update+delete as delete", () => {
    const map = new Map<string, number>([["a", 0]]);
    const diffingMap = new DiffingMap(map);

    diffingMap.set("a", 10);
    diffingMap.delete("a");

    expect(diffingMap.getDiff()).toStrictEqual({
      added: new Set([]),
      updated: new Set([]),
      deleted: new Set(["a"]),
    });
  });

  it("counts delete+add as update if different from original", () => {
    const map = new Map<string, number>([["a", 0]]);
    const diffingMap = new DiffingMap(map);

    diffingMap.delete("a");
    diffingMap.set("a", 1);

    expect(diffingMap.getDiff()).toStrictEqual({
      added: new Set([]),
      updated: new Set(["a"]),
      deleted: new Set([]),
    });
  });

  it("counts delete+add as update if same as original", () => {
    const map = new Map<string, number>([["a", 0]]);
    const diffingMap = new DiffingMap(map);

    diffingMap.delete("a");
    diffingMap.set("a", 0);

    expect(diffingMap.getDiff()).toStrictEqual({
      added: new Set([]),
      updated: new Set([]),
      deleted: new Set([]),
    });
  });

  it.each([
    [(e1: Error, e2: Error) => String(e1) === String(e2), new Set([])],
    [undefined, new Set(["a"])],
  ])(
    "accepts a custom comparer for determining updates",
    (areEqual, expectedUpdated) => {
      const map = new Map<string, Error>([["a", Error("meow")]]);
      const diffingMap = new DiffingMap(map, areEqual);

      diffingMap.set("a", Error("meow"));
      expect(diffingMap.getDiff().updated).toStrictEqual(expectedUpdated);

      diffingMap.set("a", Error("purr"));
      expect(diffingMap.getDiff().updated).toStrictEqual(new Set(["a"]));
    }
  );
});
