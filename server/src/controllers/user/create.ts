import { Request, Response } from "express";
import { Schema } from "ajv";
import * as ajv from "../../util/ajv";
import * as auth from "../../util/auth";
import { User } from "../../database/models";
import { ClientError } from "../../util/errors";

type PathParams = never;
type BodyParams = { email: string; username: string };
type QueryParams = never;
type ResponseBody = { result: { userId: string; token: string } };

type CreateUserRequest = Request<
  PathParams,
  ResponseBody,
  BodyParams,
  QueryParams
> & { headers: { authorization: string } };
type CreateUserResponse = Response<ResponseBody>;

const schema: Schema = {
  type: "object",
  properties: {
    username: { type: "string", minLength: 3 },
  },
  required: ["username"],
  additionalProperties: false,
};

const validateBody: (obj: unknown) => asserts obj is BodyParams =
  ajv.makeValidator<BodyParams>(schema);

const validateRequest: (req: Request) => asserts req is CreateUserRequest = (
  req: Request
) => {
  validateBody(req.body);
  auth.signupToken.verifyHeader(req.headers.authorization ?? "");
};

const create = async (req: Request, res: CreateUserResponse): Promise<void> => {
  validateRequest(req);
  const { username } = req.body;
  const { email } = auth.signupToken.verifyHeader(req.headers.authorization);

  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ClientError(`User with email "${email}" already exists.`);
  }

  const newUser = await User.create({
    email,
    username,
  });

  const { publicId: userId } = newUser;
  const accessToken = auth.accessToken.generate(userId);

  res.json({
    result: {
      userId,
      token: accessToken,
    },
  });
};

export default create;
