import { Schema } from "ajv";
import type { Request, Response } from "express";
import * as mail from "../../util/email";
import * as ajv from "../../util/ajv";
import { User } from "../../database/models";
import { accessToken } from "../../util/auth";

type PathParams = never;
type BodyParams = { email: string };
type QueryParams = never;
type ResponseBody = { result: true };

type LoginRequest = Request<PathParams, ResponseBody, BodyParams, QueryParams>;
type LoginResponse = Response<ResponseBody>;

const schema: Schema = {
  type: "object",
  properties: {
    email: { type: "string" },
  },
  required: ["email"],
  additionalProperties: false,
};

const loginEmail = (email: string) => {
  const token = accessToken.generate(email);
  const link = `http://localhost:3000?login=${token}`;
  const html = `
  <p>
  To login to your <a href="https://math3d.org">math3d.org</a> account,
  follow the link below.
  </p>

  <a href="${link}">${link}</a>
  `;

  return { html };
};

const validateBody = ajv.makeValidator<BodyParams>(schema);

const validateRequest: (req: Request) => asserts req is LoginRequest = (
  req: Request
) =>
  // TODO: validate email
  validateBody(req.body);

const login = async (req: Request, res: LoginResponse): Promise<void> => {
  validateRequest(req);
  const { email } = req.body;
  const user = await User.findByEmail(email);
  if (user) {
    const { html } = loginEmail(user.publicId);
    await mail.sendMail({
      from: "login@math3d.com",
      to: email,
      subject: "Math3d Login",
      html,
    });
  }

  res.json({ result: true });
};

export default login;
