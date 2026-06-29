import type { components } from "./generated-v1";

type V1Schemas = components["schemas"];

export type Scene = V1Schemas["SceneSchema"];
export type MiniScene = V1Schemas["MiniSceneSchema"];
export type PagedMiniSceneSchema = V1Schemas["PagedMiniSceneSchema"];
export type User = V1Schemas["UserSchema"];
export type SceneCreateSchema = V1Schemas["SceneCreateSchema"];
export type ScenePatchSchema = V1Schemas["ScenePatchSchema"];
export type UserUpdateSchema = V1Schemas["UserUpdateSchema"];
export type DeleteAccountSchema = V1Schemas["DeleteAccountSchema"];

export * from "./hooks/auth";
export * from "./hooks/scenes";
export { createV1Client, v1Client } from "./hooks/util";
export { isApiError, ApiError } from "./util";
