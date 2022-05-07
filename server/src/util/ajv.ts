import Ajv, { Schema } from "ajv";
import { ClientError } from "./errors";

const ajv = new Ajv();

export const makeValidator = <T>(
  schema: Schema
): ((obj: unknown) => asserts obj is T) => {
  const compiledValidator = ajv.compile(schema);

  /**
   * Validate obj against the schema used to create this validator.
   * @throws {ClientError} when validation fails.
   */
  return (obj) => {
    const isValid = compiledValidator(obj);
    if (!isValid) {
      const errMsg = compiledValidator.errors?.[0]?.message ?? "Error";
      throw new ClientError(errMsg);
    }
  };
};
