import { describe, expect, it } from "vitest";
import { sceneFrameUrl, sceneImagePathToKey, sceneImageKey } from "./keys";

describe("sceneImagePathToKey", () => {
  it("extracts a valid key", () => {
    expect(sceneImagePathToKey("/screenshots/scene/abc_1-2.png")).toBe(
      "abc_1-2",
    );
  });
  it("rejects a non-image path", () => {
    expect(sceneImagePathToKey("/screenshots/scene/abc")).toBeNull();
  });
  it("rejects a bad-charset key", () => {
    expect(sceneImagePathToKey("/screenshots/scene/a b.png")).toBeNull();
  });
  it("rejects a nested path (key may not contain a slash)", () => {
    expect(sceneImagePathToKey("/screenshots/scene/a/b.png")).toBeNull();
  });
});

it("builds storage keys", () => {
  expect(sceneImageKey("abc")).toBe("screenshots/scene/abc.png");
});

it("builds the frame URL from FRAME_ORIGIN and key", () => {
  const env = { FRAME_ORIGIN: "https://next.math3d.org" } as never;
  expect(sceneFrameUrl(env, "abc")).toBe(
    "https://next.math3d.org/app/frame/abc",
  );
});
