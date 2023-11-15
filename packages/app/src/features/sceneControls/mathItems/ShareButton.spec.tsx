import { test, expect, vi } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import { makeItem, renderTestApp, screen, seedDb, user } from "@/test_util";
import axios from "@/util/axios";
import { Scene } from "@/types";
import { urls } from "@/api";

describe("Share Button", () => {
  beforeAll(() => {
    Object.assign(window.navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
    });
  });
  afterAll(() => {
    // @ts-expect-error This is fake clipboard
    delete window.navigator.clipboard;
  });

  test("Clicking Share button sends correct POST request", async () => {
    vi.spyOn(axios, "post");
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.key}`);
    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);

    expect(axios.post).toHaveBeenCalledWith(urls.SCENE_CREATE, {
      title: scene.title,
      items: scene.items,
      itemOrder: scene.itemOrder,
    });
  });

  test("Clicking Share button shows dialog with shareable URL", async () => {
    vi.spyOn(axios, "post");
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.key}`);

    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);

    const input =
      await screen.findByLabelText<HTMLInputElement>("Shareable URL");
    const saved: Scene = vi.mocked(axios.post).mock.results[0].value.data;
    const expectedUrl = `${window.location.origin}/${saved.key}`;
    expect(input.value).toBe(expectedUrl);
  });

  test("Clicking Copy button copies the URL", async () => {
    await renderTestApp();

    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);

    const input =
      await screen.findByLabelText<HTMLInputElement>("Shareable URL");
    const url = input.value;

    const copiedIndicator = screen.getByText("Copied!");
    expect(copiedIndicator).toHaveClass("not-copied");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(url);
    expect(copiedIndicator).not.toHaveClass("not-copied");
  });
});
