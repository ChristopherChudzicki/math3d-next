declare namespace R {
  interface Static {
    filter<T>(fn: (value: T) => boolean): (list: ReadonlyArray<T>) => T[];
    filter<T>(fn: (value: T) => boolean, list: ReadonlyArray<T>): T[];
  }
}
