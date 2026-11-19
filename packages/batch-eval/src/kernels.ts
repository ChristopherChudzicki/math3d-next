import type { Column, Pool } from "./types";

export type Kernel1 = (count: number, a: Column, pool: Pool) => Column;
export type Kernel2 = (
  count: number,
  a: Column,
  b: Column,
  pool: Pool,
) => Column;

// Each operator has its own loops so each loop sees one operation and one
// pair of operand shapes.

export const add: Kernel2 = (count, a, b, pool) => {
  if (typeof a === "number") {
    if (typeof b === "number") return a + b;
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = a + b[i];
    return out;
  }
  const out = pool.take();
  if (typeof b === "number") {
    for (let i = 0; i < count; i += 1) out[i] = a[i] + b;
  } else {
    for (let i = 0; i < count; i += 1) out[i] = a[i] + b[i];
  }
  return out;
};

export const subtract: Kernel2 = (count, a, b, pool) => {
  if (typeof a === "number") {
    if (typeof b === "number") return a - b;
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = a - b[i];
    return out;
  }
  const out = pool.take();
  if (typeof b === "number") {
    for (let i = 0; i < count; i += 1) out[i] = a[i] - b;
  } else {
    for (let i = 0; i < count; i += 1) out[i] = a[i] - b[i];
  }
  return out;
};

export const multiply: Kernel2 = (count, a, b, pool) => {
  if (typeof a === "number") {
    if (typeof b === "number") return a * b;
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = a * b[i];
    return out;
  }
  const out = pool.take();
  if (typeof b === "number") {
    for (let i = 0; i < count; i += 1) out[i] = a[i] * b;
  } else {
    for (let i = 0; i < count; i += 1) out[i] = a[i] * b[i];
  }
  return out;
};

export const divide: Kernel2 = (count, a, b, pool) => {
  if (typeof a === "number") {
    if (typeof b === "number") return a / b;
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = a / b[i];
    return out;
  }
  const out = pool.take();
  if (typeof b === "number") {
    for (let i = 0; i < count; i += 1) out[i] = a[i] / b;
  } else {
    for (let i = 0; i < count; i += 1) out[i] = a[i] / b[i];
  }
  return out;
};

export const unaryMinus: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return -a;
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = -a[i];
  return out;
};

export const unaryPlus: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return a;
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = a[i];
  return out;
};

/** `x ** n` for a whole number `n`. */
export const powInt =
  (n: number): Kernel1 =>
  (count, a, pool) => {
    if (typeof a === "number") return a ** n;
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = a[i] ** n;
    return out;
  };
