import { Request, Response } from "express";
import { Schema } from "ajv";
import * as ajv from "../../util/ajv";
import { ClientError } from "../../util/errors";
import * as auth from "../../util/auth";

type PathParams = never;
type BodyParams = { email: string; username: string };
type QueryParams = never;
type ResponseBody = { result: true; token: string };

type CreateUserRequest = Request<
  PathParams,
  ResponseBody,
  BodyParams,
  QueryParams
>;
type CreateUserResponse = Response<ResponseBody>;

const schema: Schema = {
  type: "object",
  properties: {
    email: { type: "string" },
    username: { type: "string", minLength: 4 },
  },
  required: ["email", "username"],
  additionalProperties: false,
};

const validateBody: (obj: unknown) => asserts obj is BodyParams =
  ajv.makeValidator<BodyParams>(schema);

const validateRequest: (req: Request) => asserts req is CreateUserRequest = (
  req: Request
) => {
  validateBody(req.body);
  const header = req.headers.authorization;
  const token = auth.parseAuthHeaderForBearer(header ?? "");
  const decoded = auth.signupToken.verify(token);
  if (decoded.email !== req.body.email) {
    throw new ClientError("Unauthorized", 401);
  }
};

const create = (req: Request, _res: CreateUserResponse): void => {
  validateRequest(req);
  const { email, username } = req.body;

  console.log(`username: ${username}`);
  console.log(`email: ${email}`);
};

export default create;
