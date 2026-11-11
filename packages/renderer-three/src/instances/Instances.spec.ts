import { describe, expect, test, vi } from "vitest";
import { MeshBasicMaterial } from "three/webgpu";
import type { InterleavedBufferAttribute } from "three/webgpu";
import { Instances } from "./Instances";
import type { Layout, Template } from "./Instances";

const TEMPLATE: Template = {
  positions: [0, 0, 0, 1, 0, 0, 0, 1, 0],
  index: [0, 1, 2],
};
const LAYOUT: Layout = [
  ["from", 3],
  ["to", 2],
];
const STRIDE = 5;

const make = () => new Instances(TEMPLATE, LAYOUT, new MeshBasicMaterial());

/** Fills `count` instances, each float set to `value`. */
const fill = (instances: Instances, count: number, value = 1) =>
  instances.fill(count, (out) => {
    out.fill(value, 0, count * STRIDE);
    return count;
  });

const bufferOf = (instances: Instances) =>
  (instances.mesh.geometry.getAttribute("from") as InterleavedBufferAttribute)
    .data;

describe("Instances", () => {
  test("lays the attributes out in one buffer, in layout order", () => {
    const instances = make();
    fill(instances, 2);
    const { geometry } = instances.mesh;
    const from = geometry.getAttribute("from") as InterleavedBufferAttribute;
    const to = geometry.getAttribute("to") as InterleavedBufferAttribute;
    expect(to.data).toBe(from.data);
    expect(from.data.stride).toBe(STRIDE);
    expect([from.itemSize, from.offset]).toEqual([3, 0]);
    expect([to.itemSize, to.offset]).toEqual([2, 3]);
  });

  test("draws as many instances as were written and uploads only those", () => {
    const instances = make();
    fill(instances, 4);
    instances.fill(4, (out) => {
      out.fill(2, 0, 3 * STRIDE);
      return 3;
    });
    expect(instances.mesh.geometry.instanceCount).toBe(3);
    expect(bufferOf(instances).updateRanges).toEqual([
      { start: 0, count: 3 * STRIDE },
    ]);
  });

  test("refills the same buffer while the instances fit", () => {
    const instances = make();
    fill(instances, 4);
    const { geometry } = instances.mesh;
    const buffer = bufferOf(instances);
    const { version } = buffer;
    fill(instances, 2, 7);
    expect(instances.mesh.geometry).toBe(geometry);
    expect(bufferOf(instances)).toBe(buffer);
    expect(buffer.version).toBeGreaterThan(version);
    expect(Array.from(buffer.array.subarray(0, 2 * STRIDE))).toEqual(
      new Array(2 * STRIDE).fill(7),
    );
  });

  test("replaces the geometry, at least doubling, when they outgrow it", () => {
    const instances = make();
    fill(instances, 4);
    const old = instances.mesh.geometry;
    const disposed = vi.fn();
    old.addEventListener("dispose", disposed);
    fill(instances, 5);
    expect(instances.mesh.geometry).not.toBe(old);
    expect(disposed).toHaveBeenCalledOnce();
    expect(instances.capacity).toBe(8);
    expect(instances.mesh.geometry.instanceCount).toBe(5);
  });

  test("refuses more instances than it made room for", () => {
    const instances = make();
    expect(() => instances.fill(2, () => 3)).toThrow();
  });

  test("draws the same instances in each of its meshes, after growing too", () => {
    const instances = new Instances(TEMPLATE, LAYOUT, [
      new MeshBasicMaterial(),
      new MeshBasicMaterial(),
    ]);
    fill(instances, 4);
    fill(instances, 5);
    const [first, second] = instances.meshes;
    expect(second.geometry).toBe(first.geometry);
    expect(second.visible).toBe(true);
  });

  test("hides the mesh while it has no instances", () => {
    const instances = make();
    fill(instances, 2);
    expect(instances.mesh.visible).toBe(true);
    fill(instances, 0);
    expect(instances.mesh.visible).toBe(false);
  });
});
