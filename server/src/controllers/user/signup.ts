import { Schema } from "ajv";
import type { Request, Response } from "express";
import * as mail from "../../util/email";
import * as ajv from "../../util/ajv";
import { User } from "../../database/models";

type PathParams = never;
type BodyParams = { email: string };
type QueryParams = never;
type ResponseBody = { result: true };

type SignupRequest = Request<PathParams, ResponseBody, BodyParams, QueryParams>;
type SignupResponse = Response<ResponseBody>;

const schema: Schema = {
  type: "object",
  properties: {
    email: { type: "string" },
  },
  required: ["email"],
  additionalProperties: false,
};

const validateBody = ajv.makeValidator<BodyParams>(schema);

const validateRequest: (req: Request) => asserts req is SignupRequest = (
  req: Request
) =>
  // TODO: validate email
  validateBody(req.body);

const signup = async (req: Request, res: SignupResponse): Promise<void> => {
  validateRequest(req);
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (user) {
    await mail.sendMail({
      from: "login@math3d.com",
      to: email,
      subject: "Math3d Signup (Existing User)",
      text: "woof woof meow",
      html: "<div>woof woof meow</div>",
    });
  } else {
    await mail.sendMail({
      from: "login@math3d.com",
      to: email,
      subject: "Math3d Signup",
      text: "woof woof meow",
      html: "<div>woof woof meow</div>",
    });
  }

  res.json({ result: true });
};

export default signup;
