import { expect, it } from "vitest";
import { matchRoute, routeMatcher } from "./routes";

it.each([
  ["/", { path: "/{-$sceneKey}", params: {} }],
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

it.each(["/abc123/def", "/App/help/reference", "/%zz"])(
  "matches nothing for %s",
  (pathname) => {
    expect(matchRoute(pathname)).toBeNull();
  },
);

it("prefers a literal segment to a param listed before it, like the router", () => {
  const match = routeMatcher(["/{-$sceneKey}", "/about"]);
  expect(match("/about")).toEqual({ path: "/about", params: {} });
});
