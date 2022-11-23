/**
 * Like `Array.prototype.map`, but does not bail early on errors. All errors are calculated
 * and grouped in an [AggregateError](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AggregateError).
 */
const aggregate = <T, R>(
  items: T[],
  cb: (item: T, i: number, arr: T[]) => R
): R[] => {
  let hasError = false;
  const itemErrors: (Error | undefined)[] = new Array(items.length).fill(
    undefined
  );
  const results = items.map((item, i, arr) => {
    try {
      return cb(item, i, arr);
    } catch (err) {
      if (!(err instanceof Error)) {
        throw new Error('Expected error to be an instance of "Error"');
      }
      itemErrors[i] = err;
      hasError = true;
      return undefined;
    }
  });
  if (hasError) {
    throw new AggregateError(itemErrors);
  }
  return results as R[];
};

export default aggregate;
