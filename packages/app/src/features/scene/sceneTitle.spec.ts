import { describe, it, expect } from "vitest";
import { sceneDisplayName, sceneTabTitle } from "./sceneTitle";

describe("sceneDisplayName", () => {
  it("returns the trimmed name for a real title", () => {
    expect(sceneDisplayName("  My Torus  ")).toBe("My Torus");
  });

  it("treats blank and the default 'Untitled' as untitled (null)", () => {
    // A scene left at the DB default should read like the home page, not carry
    // a scene-specific title.
    expect(sceneDisplayName("")).toBeNull();
    expect(sceneDisplayName("   ")).toBeNull();
    expect(sceneDisplayName("Untitled")).toBeNull();
  });

  it("clamps to 200 code points without splitting a surrogate pair", () => {
    const name = sceneDisplayName("😀".repeat(300));
    expect(Array.from(name!)).toHaveLength(200);
    expect(name!.endsWith("😀")).toBe(true);
  });
});

describe("sceneTabTitle", () => {
  it("formats a real title as '{name} | Math3d'", () => {
    expect(sceneTabTitle("My Torus", "SITE DEFAULT")).toBe("My Torus | Math3d");
  });

  it("uses the provided site default for an untitled scene", () => {
    expect(sceneTabTitle("Untitled", "SITE DEFAULT")).toBe("SITE DEFAULT");
  });
});
