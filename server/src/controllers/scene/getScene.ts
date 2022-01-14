import { Schema } from "ajv";
import { Request, Response } from "express";
import { ClientError } from "../../util/errors";
import { Scene, PublicScene } from "../../database/models";
import * as ajv from "../../util/ajv";

type PathParams = { sceneId: string };
type BodyParams = never;
type QueryParams = never;
type ResponseBody = { result: { scene: PublicScene } };

type GetSceneRequest = Request<
  PathParams,
  ResponseBody,
  BodyParams,
  QueryParams
>;
type GetSceneResponse = Response<ResponseBody>;

const paramsSchema: Schema = {
  type: "object",
  properties: {
    sceneId: { type: "string" },
  },
  required: ["sceneId"],
  additionalProperties: false,
};

const validateParams: (obj: unknown) => asserts obj is PathParams =
  ajv.makeValidator<PathParams>(paramsSchema);

const validateRequest: (req: Request) => asserts req is GetSceneRequest = (
  req: Request
) => {
  validateParams(req.params);
};

const getScene = async (req: Request, res: GetSceneResponse): Promise<void> => {
  validateRequest(req);
  const { sceneId: publicId } = req.params;
  const scene = await Scene.findByPublicId(publicId);
  if (scene === null) {
    throw new ClientError(`Scene ${publicId} does not exist`);
  }
  const publicScene = scene.toPublicScene();
  res.json({ result: { scene: publicScene } });
};

export default getScene;
