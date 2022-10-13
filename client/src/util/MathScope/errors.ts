export class MathScopeError extends Error {
  constructor(msg: string | Error) {
    super(typeof msg === "string" ? msg : msg.message);
  }
}

export class ParsingError extends MathScopeError {}

export class EvaluationError extends MathScopeError {}

export interface IBatchedError {
  errors: Map<string, Error>;
}
