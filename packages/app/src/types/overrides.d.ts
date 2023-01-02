declare namespace R {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Static {
    filter<T>(fn: (value: T) => boolean): (list: ReadonlyArray<T>) => T[];
    filter<T>(fn: (value: T) => boolean, list: ReadonlyArray<T>): T[];
  }
}
