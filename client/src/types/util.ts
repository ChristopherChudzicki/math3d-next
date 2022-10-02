/**
 * Make properties K in T optional.
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Extract the resolved type from a promise.
 */
export type ResolvePromise<T extends Promise<unknown>> = Parameters<
  NonNullable<Parameters<T["then"]>[0]>
>[0];
