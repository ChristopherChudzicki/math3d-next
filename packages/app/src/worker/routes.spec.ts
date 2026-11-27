import { expect, it } from "vitest";
import { matchRoute } from "./routes";

it.each([
  ["/abc123", { path: "/{-$sceneKey}", params: { sceneKey: "abc123" } }],
  ["/abc123/", { path: "/{-$sceneKey}", params: { sceneKey: "abc123" } }],
  ["/app/frame/x", { path: "/app/frame/$sceneKey", params: { sceneKey: "x" } }],
  ["/app/help/%72eference", { path: "/app/help/reference", params: {} }],
  // Decoded after splitting: an encoded slash stays inside its segment.
  [
    "/app%2Fframe%2Fx",
    { path: "/{-$sceneKey}", params: { sceneKey: "app/frame/x" } },
  ],
])("matches %s like the router", (pathname, expected) => {
  expect(matchRoute(pathname)).toEqual(expected);
});
