import { describe, expect, it } from "vitest";
import { sceneImagePathToKey, sceneImageKey, lockKey } from "./keys";

describe("sceneImagePathToKey", () => {
  it("extracts a valid key", () => {
    expect(sceneImagePathToKey("/og/scene/abc_1-2.png")).toBe("abc_1-2");
  });
  it("rejects a non-image path", () => {
    expect(sceneImagePathToKey("/og/scene/abc")).toBeNull();
  });
  it("rejects a bad-charset key", () => {
    expect(sceneImagePathToKey("/og/scene/a b.png")).toBeNull();
  });
  it("rejects a nested path (key may not contain a slash)", () => {
    expect(sceneImagePathToKey("/og/scene/a/b.png")).toBeNull();
  });
});

it("builds storage keys", () => {
  expect(sceneImageKey("abc")).toBe("og/scene/abc.png");
  expect(lockKey("abc")).toBe("og/lock/abc");
});
