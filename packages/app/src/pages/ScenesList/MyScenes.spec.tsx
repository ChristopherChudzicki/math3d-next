import { test, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@math3d/mock-api/node";
import { seedDb } from "@math3d/mock-api";
import { act, renderTestApp, screen, user, waitFor, within } from "@/test_util";

const ME_LIST = "*/v1/scenes/me/";

/** Seeds scenes for a new user, newest first in the order given. */
const seedScenes = (titles: string[]) => {
  const owner = seedDb.withUser();
  const scenes = titles.map((title, i) =>
    seedDb.withSceneFromItems([], {
      title,
      author: owner.id,
      modifiedDate: new Date(Date.UTC(2026, 0, 30 - i)).toISOString(),
    }),
  );
  return { owner, scenes };
};

const openMyScenes = async (
  owner: ReturnType<typeof seedDb.withUser>,
  path = "/",
) => {
  const { location } = renderTestApp(`${path}?overlay=scenes&list=me`, {
    user: owner,
  });
  const dialog = await screen.findByRole("dialog", { name: "Scenes" });
  return { location, dialog };
};

const chooseAction = async (title: string, action: string) => {
  await user.click(
    screen.getByRole("button", { name: `Actions for ${title}` }),
  );
  await user.click(await screen.findByRole("menuitem", { name: action }));
};

test("a slow filter response keeps the current results, and the field keeps focus", async () => {
  const { owner } = seedScenes(["Alpha", "Beta"]);
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  let release = () => {};
  let started = false;
  server.use(
    http.get(ME_LIST, async () => {
      started = true;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      // Returning nothing falls through to the default handler.
    }),
  );
  const field = screen.getByRole("textbox", { name: "Filter scenes" });
  await user.type(field, "Al");
  await waitFor(() => expect(started).toBe(true));

  expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(field).toHaveFocus();

  act(() => release());
  await waitFor(() =>
    expect(screen.queryByRole("link", { name: "Beta" })).toBeNull(),
  );
  expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
});

test("empty states say whether nothing is saved or nothing matches", async () => {
  const { owner } = seedScenes([]);
  await openMyScenes(owner);

  expect(
    await screen.findByText(/You haven't saved any scenes yet/),
  ).toBeInTheDocument();
  expect(screen.getByText("Archived scenes are hidden.")).toBeInTheDocument();

  await user.type(
    screen.getByRole("textbox", { name: "Filter scenes" }),
    "zzz",
  );
  expect(await screen.findByText("No scenes match “zzz”.")).toBeInTheDocument();
});

test("archiving hides the card, announces it, and focuses the next card", async () => {
  const { owner } = seedScenes(["Alpha", "Beta", "Gamma"]);
  const { dialog } = await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Archive");

  await waitFor(() =>
    expect(screen.queryByRole("link", { name: "Alpha" })).toBeNull(),
  );
  expect(screen.getByRole("link", { name: "Beta" })).toHaveFocus();
  expect(within(dialog).getByRole("status")).toHaveTextContent(
    "Archived Alpha",
  );
});

test("deleting confirms first, then focuses the next card", async () => {
  const { owner } = seedScenes(["Alpha", "Beta"]);
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Delete");
  const confirm = await screen.findByRole("alertdialog", {
    name: "Delete scene?",
  });
  await waitFor(() =>
    expect(
      within(confirm).getByRole("button", { name: "Cancel" }),
    ).toHaveFocus(),
  );
  await user.click(within(confirm).getByRole("button", { name: "Delete" }));

  await waitFor(() =>
    expect(screen.queryByRole("link", { name: "Alpha" })).toBeNull(),
  );
  await waitFor(() =>
    expect(screen.getByRole("link", { name: "Beta" })).toHaveFocus(),
  );
});

test("deleting the only card focuses the filter field", async () => {
  const { owner } = seedScenes(["Alpha"]);
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Delete");
  const confirm = await screen.findByRole("alertdialog");
  await user.click(within(confirm).getByRole("button", { name: "Delete" }));

  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Filter scenes" }),
    ).toHaveFocus(),
  );
});

test("deleting the open scene replaces its URL with the scenes list", async () => {
  const { owner, scenes } = seedScenes(["Alpha"]);
  const { location } = await openMyScenes(owner, `/${scenes[0].key}`);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Delete");
  const confirm = await screen.findByRole("alertdialog");
  await user.click(within(confirm).getByRole("button", { name: "Delete" }));

  await waitFor(() => expect(location.current.pathname).toBe("/"));
  expect(location.current.search).toContain("list=me");
});

test("clicking the open scene's card closes the dialog without a new history entry", async () => {
  const { owner, scenes } = seedScenes(["Alpha"]);
  const [{ key }] = scenes;
  const { router, location } = renderTestApp(`/${key}`, { user: owner });
  // As useOverlay's open(): a pushed entry, marked so close() pops it.
  await act(() =>
    router.navigate(
      { pathname: `/${key}`, search: "?overlay=scenes&list=me" },
      { state: { overlayPushed: true } },
    ),
  );

  await user.click(await screen.findByRole("link", { name: "Alpha" }));

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull(),
  );
  expect(location.current.search).toBe("");
  // Back from the first entry goes nowhere; a pushed duplicate would reopen.
  await act(() => router.navigate(-1));
  expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull();
});

test("a failed load offers Retry", async () => {
  const { owner } = seedScenes(["Alpha"]);
  server.use(
    http.get(
      ME_LIST,
      () => HttpResponse.json({ detail: "boom" }, { status: 500 }),
      { once: true },
    ),
  );
  await openMyScenes(owner);

  await user.click(await screen.findByRole("button", { name: "Retry" }));

  expect(
    await screen.findByRole("link", { name: "Alpha" }),
  ).toBeInTheDocument();
});
