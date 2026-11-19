import { expect, test } from "vitest";
import { createPool } from "./pool";

test("each take in a run gives its own array of the run's length", () => {
  const pool = createPool();
  pool.reset(8);
  const first = pool.take();
  const second = pool.take();
  expect(first).toHaveLength(8);
  expect(second).toHaveLength(8);
  expect(second).not.toBe(first);
});

test("a new run of the same length reuses the arrays", () => {
  const pool = createPool();
  pool.reset(8);
  const first = pool.take();
  pool.reset(8);
  expect(pool.take()).toBe(first);
});

test("a run of another length gets arrays of that length", () => {
  const pool = createPool();
  pool.reset(8);
  pool.take();
  pool.reset(4);
  expect(pool.take()).toHaveLength(4);
});
