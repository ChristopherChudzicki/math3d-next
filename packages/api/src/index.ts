export { DefaultApi, Configuration } from "./generated-v1";
export type {
  SceneSchema as Scene,
  MiniSceneSchema as MiniScene,
  PagedMiniSceneSchema,
  UserSchema as User,
  SceneCreateSchema,
  ScenePatchSchema,
  UserUpdateSchema,
  DeleteAccountSchema,
} from "./generated-v1";
export * from "./hooks/auth";
export * from "./hooks/scenes";
export { getConfig } from "./hooks/util";
export { isAxiosError } from "./util";
