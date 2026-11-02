import type { EvaluationScope, Scope } from "../interfaces";

/**
 * A scope that keeps writes in its own layer and reads through to `parent`.
 *
 * mathjs runs an assignment anywhere in an expression, as in `f(t = 0)`,
 * against the scope it is given. Evaluating each expression in its own layer
 * keeps that assignment from changing `t` for every other expression.
 */
export default class LayeredScope implements Scope {
  private readonly layer: EvaluationScope = new Map();

  constructor(private readonly parent: EvaluationScope) {}

  get(key: string): unknown {
    return this.layer.has(key) ? this.layer.get(key) : this.parent.get(key);
  }

  has(key: string): boolean {
    return this.layer.has(key) || this.parent.has(key);
  }

  set(key: string, value: unknown): this {
    this.layer.set(key, value);
    return this;
  }

  // mathjs recognizes a Map-like scope by `get`, `set`, `has` and `keys`.
  keys(): IterableIterator<string> {
    return new Set([...this.parent.keys(), ...this.layer.keys()]).values();
  }
}
