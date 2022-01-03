import Ajv, { Schema } from "ajv";
import type { Request, Response } from "express";
import { sendEmail } from "../../util/email";
import { ClientError } from "../../util/errors";

const ajv = new Ajv();

const schema: Schema = {
  type: "object",
  properties: {
    email: { type: "string" },
  },
  required: ["email"],
  additionalProperties: false,
};
const validate = ajv.compile(schema);

const validateRequest = (req: Request) => {
  const isValid = validate(req.body);
  if (!isValid) {
    const errMsg = validate.errors?.[0]?.message ?? "Error";
    throw new ClientError(errMsg);
  }
  return true;
};

const signup = async (req: Request, res: Response): Promise<void> => {
  validateRequest(req);
  const { email }: { email: string } = req.body;
  await sendEmail(email);
  res.json({ ok: "yay" });
};

export default signup;
