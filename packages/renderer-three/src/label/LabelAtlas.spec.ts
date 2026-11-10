import { describe, expect, test, vi } from "vitest";
import { ATLAS_WIDTH, LabelAtlas } from "./LabelAtlas";
import type { AtlasSurface, LabelText, Slot } from "./LabelAtlas";

/** Rasters 10 device pixels per character, 20 tall, scaled by the ratio. */
const fakeSurface = () => {
  const surface = {
    measure: vi.fn(({ text }: LabelText, ratio: number): [number, number] => [
      10 * text.length * ratio,
      20 * ratio,
    ]),
    reset: vi.fn<AtlasSurface["reset"]>(),
    draw: vi.fn<AtlasSurface["draw"]>(),
  };
  return surface;
};

const label = (text: string): LabelText => ({ text, weight: "normal" });

const overlaps = (a: Slot, b: Slot) =>
  a.x < b.x + b.width &&
  b.x < a.x + a.width &&
  a.y < b.y + b.height &&
  b.y < a.y + a.height;

describe("LabelAtlas", () => {
  test("draws a string once, however many labels use it", () => {
    const surface = fakeSurface();
    const atlas = new LabelAtlas(surface, () => {});
    atlas.acquire(label("1"));
    atlas.acquire(label("1"));
    atlas.acquire(label("2"));
    expect(surface.draw.mock.calls.map(([drawn]) => drawn.text)).toEqual([
      "1",
      "2",
    ]);
  });

  test("tells bold from normal text", () => {
    const atlas = new LabelAtlas(fakeSurface(), () => {});
    atlas.acquire(label("x"));
    atlas.acquire({ text: "x", weight: "bold" });
    expect(atlas.slot(label("x"))).not.toEqual(
      atlas.slot({ text: "x", weight: "bold" }),
    );
  });

  test("keeps a string until its last user releases it", () => {
    const atlas = new LabelAtlas(fakeSurface(), () => {});
    atlas.acquire(label("1"));
    atlas.acquire(label("1"));
    atlas.release(label("1"));
    expect(() => atlas.slot(label("1"))).not.toThrow();
    atlas.release(label("1"));
    expect(() => atlas.slot(label("1"))).toThrow();
  });

  test("frees the surface when no strings remain", () => {
    const surface = fakeSurface();
    const atlas = new LabelAtlas(surface, () => {});
    atlas.acquire(label("1"));
    atlas.release(label("1"));
    expect(surface.reset).toHaveBeenLastCalledWith(0, 0);
    expect(atlas.size).toEqual([0, 0]);
  });

  test("grows by laying every string out again, without overlaps", () => {
    const surface = fakeSurface();
    const onRelayout = vi.fn();
    const atlas = new LabelAtlas(surface, onRelayout);
    const texts = Array.from({ length: 200 }, (_, i) => label(`label ${i}`));
    texts.forEach((text) => atlas.acquire(text));

    const [width, height] = atlas.size;
    expect(width).toBe(ATLAS_WIDTH);
    expect(height).toBeGreaterThan(64);
    expect(surface.reset).toHaveBeenLastCalledWith(width, height);
    expect(onRelayout).toHaveBeenCalled();
    const slots = texts.map((text) => atlas.slot(text));
    slots.forEach((slot, i) => {
      expect(slot.x + slot.width).toBeLessThanOrEqual(width);
      expect(slot.y + slot.height).toBeLessThanOrEqual(height);
      slots.slice(i + 1).forEach((other) => {
        expect(overlaps(slot, other)).toBe(false);
      });
    });
  });

  test("reclaims a released string's space when it next lays out", () => {
    const atlas = new LabelAtlas(fakeSurface(), () => {});
    atlas.acquire(label("kept"));
    atlas.acquire(label("gone"));
    atlas.release(label("gone"));
    atlas.relayout();
    atlas.acquire(label("new"));
    expect(atlas.slot(label("new")).x).toBe(
      atlas.slot(label("kept")).width + 1,
    );
  });

  test("draws every string again at a new pixel ratio", () => {
    const surface = fakeSurface();
    const onRelayout = vi.fn();
    const atlas = new LabelAtlas(surface, onRelayout);
    atlas.acquire(label("1"));
    surface.draw.mockClear();
    onRelayout.mockClear();
    atlas.setPixelRatio(2);
    expect(atlas.pixelRatio).toBe(2);
    expect(surface.draw).toHaveBeenCalledWith(
      label("1"),
      { x: 0, y: 0, width: 20, height: 40 },
      2,
    );
    expect(onRelayout).toHaveBeenCalledOnce();
  });
});
