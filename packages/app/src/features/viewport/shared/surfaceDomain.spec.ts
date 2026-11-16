import { domainMap } from "./surfaceDomain";

test("domainMap evaluates the second parameter's range at the first's value", () => {
  const map = domainMap({
    value: [() => [0, 2], (u) => [0, u]],
    order: [0, 1],
  });
  expect(map(0.5, 0.5)).toEqual([1, 0.5]);
});

test("domainMap maps U onto the second parameter when its range is the constant one", () => {
  const map = domainMap({
    value: [(v) => [0, v], () => [0, 2]],
    order: [1, 0],
  });
  expect(map(0.5, 0.5)).toEqual([0.5, 1]);
});

test("domainMap evaluates each range once per distinct argument", () => {
  const first = vi.fn((): [number, number] => [0, 2]);
  const second = vi.fn((u: number): [number, number] => [0, u]);
  const map = domainMap({ value: [first, second], order: [0, 1] });
  const points = [0, 0.5, 1].flatMap((V) => [0, 0.5, 1].map((U) => map(U, V)));
  expect(points[4]).toEqual([1, 0.5]);
  expect(first).toHaveBeenCalledTimes(1);
  expect(second.mock.calls).toEqual([[0], [1], [2]]);
});

test("a range function that throws does so at a sample, not when the map is built", () => {
  const map = domainMap({
    value: [
      () => {
        throw new Error("no range");
      },
      (u) => [0, u],
    ],
    order: [0, 1],
  });
  expect(() => map(0.5, 0.5)).toThrow("no range");
});
