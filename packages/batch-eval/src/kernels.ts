import { typed } from "@math3d/custom-mathjs";
import { Decline } from "./types";
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

// One loop per function, written out: a loop shared by several functions,
// `generic`'s or any a factory returns, runs each of them slower once it has
// called a second (measured; the cause isn't confirmed).
export const sin: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.sin(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.sin(a[i]);
  return out;
};

export const cos: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.cos(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.cos(a[i]);
  return out;
};

export const tan: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.tan(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.tan(a[i]);
  return out;
};

export const atan: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.atan(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.atan(a[i]);
  return out;
};

export const sinh: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.sinh(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.sinh(a[i]);
  return out;
};

export const cosh: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.cosh(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.cosh(a[i]);
  return out;
};

export const tanh: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.tanh(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.tanh(a[i]);
  return out;
};

export const exp: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.exp(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.exp(a[i]);
  return out;
};

export const abs: Kernel1 = (count, a, pool) => {
  if (typeof a === "number") return Math.abs(a);
  const out = pool.take();
  for (let i = 0; i < count; i += 1) out[i] = Math.abs(a[i]);
  return out;
};

type Fn = (...args: unknown[]) => unknown;

const number = (value: unknown): number => {
  if (typeof value !== "number") throw new Decline();
  return value;
};

/**
 * `fn` per sample, through its number implementation for one or two
 * operands, as `fastCompile` calls it.
 */
export const generic = (
  fn: Fn,
  arity: number,
): ((count: number, args: Column[], pool: Pool) => Column) => {
  const resolved =
    (arity === 1 || arity === 2) && typed.isTypedFunction(fn)
      ? typed.resolve(fn, Array(arity).fill(0))?.implementation
      : undefined;
  const f = resolved ?? fn;
  if (arity === 1) {
    return (count, [a], pool) => {
      if (typeof a === "number") return number(f(a));
      const out = pool.take();
      for (let i = 0; i < count; i += 1) out[i] = number(f(a[i]));
      return out;
    };
  }
  if (arity === 2) {
    return (count, [a, b], pool) => {
      if (typeof a === "number") {
        if (typeof b === "number") return number(f(a, b));
        const out = pool.take();
        for (let i = 0; i < count; i += 1) out[i] = number(f(a, b[i]));
        return out;
      }
      const out = pool.take();
      if (typeof b === "number") {
        for (let i = 0; i < count; i += 1) out[i] = number(f(a[i], b));
      } else {
        for (let i = 0; i < count; i += 1) out[i] = number(f(a[i], b[i]));
      }
      return out;
    };
  }
  return (count, args, pool) => {
    const operands = new Array<number>(args.length);
    const at = (i: number) => {
      for (let k = 0; k < args.length; k += 1) {
        const arg = args[k];
        operands[k] = typeof arg === "number" ? arg : arg[i];
      }
      return number(f(...operands));
    };
    if (args.every((arg) => typeof arg === "number")) return at(0);
    const out = pool.take();
    for (let i = 0; i < count; i += 1) out[i] = at(i);
    return out;
  };
};
