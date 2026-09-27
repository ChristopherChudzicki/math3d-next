import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb, urls } from "@math3d/mock-api";
import { renderTestApp, screen, user, waitFor, within } from "@/test_util";

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

  // useValidatedForm routes every rejected submit to "root", so a server-side
  // failure is invisible unless the root error renders.
  expect(
    await within(dialog).findByText(/something went wrong/i),
  ).toBeVisible();
});

test("an empty title is reported instead of silently blocking the save", async () => {
  const scene = seedDb.withSceneFromItems([]);
  renderTestApp(`/${scene.key}`, { isAuthenticated: true });

  await user.click(
    await screen.findByRole("button", { name: "Other Saving Options" }),
  );
  await user.click(await screen.findByRole("menuitem", { name: "Duplicate" }));

  const dialog = await screen.findByRole("dialog", { name: "Save a Copy" });
  const title = within(dialog).getByLabelText("Title");
  await user.clear(title);
  await user.click(within(dialog).getByRole("button", { name: "Save" }));

  await waitFor(() => expect(title).toBeInvalid());
  expect(within(dialog).getByText("Please enter a title.")).toBeVisible();
});
