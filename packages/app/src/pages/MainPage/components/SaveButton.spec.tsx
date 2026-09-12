import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import { renderTestApp, screen, user, within } from "@/test_util";

test("a failed save surfaces the error in the dialog", async () => {
  server.use(
    http.post(urls.scenes.list, () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  await user.click(
    await screen.findByRole("button", { name: "Other Saving Options" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));

  const dialog = await screen.findByRole("dialog", { name: "Save a Copy" });
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  // The title is the form's only field, so a server-side failure has no field
  // to attach to and is invisible unless the root error renders.
  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
});
