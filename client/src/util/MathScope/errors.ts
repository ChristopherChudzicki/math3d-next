export class MathScopeError extends Error {
  constructor(msg: string | Error) {
    super(typeof msg === "string" ? msg : msg.message);
  }
}

export class EvaluationError extends MathScopeError {}
