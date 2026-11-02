import type { Scope } from "../interfaces";

/** A scope that keeps writes in its own layer and reads through to `parent`. */
export default class LayeredScope implements Scope {
  private readonly layer = new Map<string, unknown>();

  constructor(private readonly parent: Scope) {}

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

  keys(): IterableIterator<string> {
    return new Set([...this.parent.keys(), ...this.layer.keys()]).values();
  }
}
