import { renderTestApp, screen, waitFor, user } from "@/test_util";
import { seedDb } from "@math3d/mock-api";
import { test, expect } from "vitest";

test("scenes drawer opens via ?overlay=scenes&list=examples", async () => {
  const scene = seedDb.withSceneFromItems([]);
  await renderTestApp(`/${scene.key}?overlay=scenes&list=examples`);
  expect(await screen.findByRole("tab", { name: "Examples" })).toBeVisible();
});

test("closing the drawer (Escape) returns to the scene", async () => {
  const scene = seedDb.withSceneFromItems([]);
  const { location } = await renderTestApp(
    `/${scene.key}?overlay=scenes&list=examples`,
  );
  await screen.findByRole("tab", { name: "Examples" });
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(location.current.search).not.toContain("overlay="),
  );
  expect(location.current.pathname).toBe(`/${scene.key}`);
});
