/**
 * Make properties K in T optional.
 */
type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the resolved type from a promise.
 */
type ResolvePromise<T extends Promise<unknown>> = Parameters<
  NonNullable<Parameters<T["then"]>[0]>
>[0];

/**
 * Create a tuple of generic length. See [Recursive conditional types](https://github.com/microsoft/TypeScript/pull/40002)
 */
type TupleOf<T, N extends number> = N extends N
  ? number extends N
    ? T[]
    : _TupleOf<T, N, []>
  : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N
  ? R
  : _TupleOf<T, N, [T, ...R]>;

export type { PartialBy, ResolvePromise, TupleOf };
