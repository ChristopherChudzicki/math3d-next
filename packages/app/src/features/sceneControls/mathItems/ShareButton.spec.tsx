import { test, expect, vi } from "vitest";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import {
  makeItem,
  renderTestApp,
  screen,
  seedDb,
  user,
  waitFor,
} from "@/test_util";

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
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.key}`);
    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);
  });

  test("Clicking Share button shows dialog with shareable URL", async () => {
    const item = makeItem(MIT.Point);
    const scene = seedDb.withSceneFromItems([item]);
    await renderTestApp(`/${scene.key}`);

    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);

    const input =
      await screen.findByLabelText<HTMLInputElement>("Shareable URL");

    await waitFor(() => {
      const url = new URL(input.value);
      expect(url).toEqual(
        expect.objectContaining({
          origin: window.location.origin,
          pathname: expect.stringMatching(/\/[\w-]+/),
        }),
      );
    });
  });

  test("Clicking Copy button copies the URL", async () => {
    await renderTestApp();

    const shareButton = screen.getByRole("button", { name: "Share" });
    await user.click(shareButton);

    const input =
      await screen.findByLabelText<HTMLInputElement>("Shareable URL");
    await waitFor(() => expect(input.value).toBeTruthy());
    const url = input.value;

    const copiedIndicator = screen.getByText("Copied!");
    expect(copiedIndicator).toHaveClass("not-copied");
    await user.click(screen.getByRole("button", { name: "Copy" }));
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(url);
    expect(copiedIndicator).not.toHaveClass("not-copied");
  });
});
