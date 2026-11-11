import { expect, test } from "vitest";
import { vec4 } from "three/tsl";
import { accumulatingLast } from "./drawOrder";
import { sharedMaterial } from "./shader/material";

const material = sharedMaterial("uniform", () => ({
  vertex: vec4(0, 0, 0, 1),
  color: vec4(1, 0, 0, 1),
}));

const item = (renderOrder: number, alpha: "edges" | "translucent") => ({
  groupOrder: 0,
  renderOrder,
  id: 0,
  material: material(alpha, "oit"),
});

test("accumulatingLast keeps draw order, but puts accumulating marks after the rest", () => {
  const items = [
    item(0, "translucent"),
    item(3, "edges"),
    item(2, "translucent"),
    item(1, "edges"),
  ];
  expect(items.sort(accumulatingLast)).toEqual([
    item(1, "edges"),
    item(3, "edges"),
    item(0, "translucent"),
    item(2, "translucent"),
  ]);
});
