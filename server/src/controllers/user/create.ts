import { Request, Response } from "express";
import { Schema } from "ajv";
import * as ajv from "../../util/ajv";
// import { signupToken, accessToken } from "../../util/tokens";

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
    username: { type: "string" },
  },
  required: ["email", "username"],
  additionalProperties: false,
};

const validateBody: (obj: unknown) => asserts obj is BodyParams =
  ajv.makeValidator<BodyParams>(schema);

const validateRequest: (req: Request) => asserts req is CreateUserRequest = (
  req: Request // TODO: validate email
) => {
  validateBody(req.body);
  const token = req.headers.authorization;
  console.log(token);
};

const create = (req: Request, _res: CreateUserResponse): void => {
  validateRequest(req);
};

export default create;
