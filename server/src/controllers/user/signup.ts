import { Schema } from "ajv";
import type { Request, Response } from "express";
import * as mail from "../../util/email";
import * as ajv from "../../util/ajv";
import { User } from "../../database/models";
import { signupToken, accessToken } from "../../util/tokens";

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

const newUserEmail = (email: string) => {
  const token = signupToken.generate(email);
  const link = `http://localhost:3000?signup=${token}`;
  const html = `
  <p>
  To finish creating your <a href="https://math3d.org">math3d.org</a> account,
  follow the link below.
  </p>

  <a href="${link}">${link}</a>

  <p>If you did not request this account creation, please
  email help@math3d.org.</p>
  `;

  return { html };
};

const existingUserEmail = (email: string) => {
  const token = accessToken.generate(email);
  const link = `http://localhost:3000?login=${token}`;
  const html = `
  <p>
  A <a href="https://math3d.org">math3d.org</a> account already exists for this,
  email address. To log into your account, use the link below.
  </p>

  <a href="${link}">${link}</a>

  <p>If you did not request this account creation, please
  email help@math3d.org.</p>
  `;

  return { html };
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
    const { html } = existingUserEmail(email);
    await mail.sendMail({
      from: "login@math3d.com",
      to: email,
      subject: "Math3d Signup (Existing User)",
      html,
    });
  } else {
    const { html } = newUserEmail(email);
    await mail.sendMail({
      from: "login@math3d.com",
      to: email,
      subject: "Math3d Signup",
      html,
    });
  }

  res.json({ result: true });
};

export default signup;
