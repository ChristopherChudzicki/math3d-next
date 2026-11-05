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
