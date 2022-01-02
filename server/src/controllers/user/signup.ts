import Ajv, { Schema } from "ajv";
import type { Request, Response } from "express";
import { sendEmail } from "../../util/email";

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
    console.log(validate.errors);
  }
  return isValid;
};

const signup = async (req: Request, res: Response): Promise<void> => {
  if (!validateRequest(req)) {
    // TODO: Throw an error instead and handle this in middleware
    res.status(400);
    return;
  }
  const { email }: { email: string } = req.body;
  await sendEmail(email);
};

export default signup;
