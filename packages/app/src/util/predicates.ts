export const isNotNil = <T>(x: T): x is NonNullable<T> => {
  if (x === null || x === undefined) return false;
  return true;
};

export const assertNotNil: <T>(
  value: T,
  msg?: string,
) => asserts value is NonNullable<T> = (value, msg) => {
  if (isNotNil(value)) return;
  if (msg) {
    throw new Error(msg);
  }
  throw new Error(`Value ${value} should not be nil.`);
};

/**
 * Type assertion that asserts value is not null or undefined.
 *
 * Unlike jest assertions, this will refine the type.
 * See https://github.com/DefinitelyTyped/DefinitelyTyped/issues/41179
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const assertInstanceOf: <C extends { new (...args: any[]): unknown }>(
  value: unknown,
  Class: C,
) => asserts value is InstanceType<C> = (value, Class) => {
  if (value instanceof Class) return;
  throw new Error(`Expected value to be instanceof ${Class}`);
};
