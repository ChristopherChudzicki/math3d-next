interface IBatchErrorCtor {
  new (errors: Record<number, Error>): IBatchError;
}

interface IBatchError extends Error {
  errors: Record<number, Error>;
}

export type { IBatchError, IBatchErrorCtor };
