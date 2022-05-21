import type { Diff } from "../interfaces";
import { setUnion } from "./util";

type Comparer<T> = (t1: T, t2: T) => boolean;

/**
 * A wrapper around native Map class that allowss tracking changes.
 *
 * Example:
 * ```ts
 * const map = new Map([['a', 0], ['b', 1]]);
 * const diffingMap = new DiffingMap(map);
 *
 * diffingMap.set('a', 10);
 * diffingMap.delete('b');
 * diffingMap.set('c', 2);
 *
 * diffingMap.getDiff()
 * // { added: Set{'c'}, updated: Set{'a'}, deleted: Set{'b'} }
 * ```
 *
 */
export default class DiffingMap<T, U> {
  map: Map<T, U>;

  changes: Map<
    T,
    {
      initiallyPresent: boolean;
      initialValue?: U;
    }
  >;

  areEqual: Comparer<U>;

  constructor(map: Map<T, U>, areEqual: Comparer<U> = Object.is) {
    this.map = map;
    this.changes = new Map();
    this.areEqual = areEqual;
  }

  has(key: T): boolean {
    return this.map.has(key);
  }

  private registerChange(key: T) {
    if (this.changes.has(key)) return;
    const initiallyPresent = this.map.has(key);
    const initialValue = this.map.get(key);
    this.changes.set(key, { initiallyPresent, initialValue });
  }

  set(key: T, item: U): Map<T, U> {
    this.registerChange(key);
    return this.map.set(key, item);
  }

  delete(key: T): boolean {
    this.registerChange(key);
    return this.map.delete(key);
  }

  /**
   * Gets diff since instantiation or last resetDiff call.
   */
  getDiff(): Diff<T> {
    const added = new Set<T>();
    const updated = new Set<T>();
    const deleted = new Set<T>();

    this.changes.forEach(({ initiallyPresent, initialValue }, key) => {
      if (!initiallyPresent) {
        if (this.map.has(key)) {
          added.add(key);
        }
      } else if (this.map.has(key)) {
        const value = this.map.get(key) as U;
        if (!this.areEqual(value, initialValue as U)) {
          updated.add(key);
        }
      } else {
        // definitely deleted
        deleted.add(key);
      }
    });

    const touched = setUnion(added, updated, deleted);
    return { added, updated, deleted, touched };
  }

  resetDiff() {
    this.changes = new Map();
  }
}
