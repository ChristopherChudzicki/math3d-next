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
  expect(screen.getByText(/check Include archived/)).toBeInTheDocument();

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

test("clicking the open scene's card does nothing, so Close still pops the drawer's entry", async () => {
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
  expect(screen.getByRole("dialog", { name: "Scenes" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Close" }));

  await waitFor(() =>
    expect(screen.queryByRole("dialog", { name: "Scenes" })).toBeNull(),
  );
  expect(location.current.search).toBe("");
  // Popped, not replaced: a replace would leave a duplicate entry behind, and
  // the next Back would appear to do nothing.
  expect(router.state.historyAction).toBe("POP");
});

test("cancelling a delete returns focus to the card's menu button", async () => {
  const { owner } = seedScenes(["Alpha"]);
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Delete");
  const confirm = await screen.findByRole("alertdialog");
  await user.click(within(confirm).getByRole("button", { name: "Cancel" }));

  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Actions for Alpha" }),
    ).toHaveFocus(),
  );
  expect(screen.getByRole("link", { name: "Alpha" })).toBeInTheDocument();
});

test("a failed delete says so in the confirmation, which stays open", async () => {
  const { owner } = seedScenes(["Alpha"]);
  server.use(
    http.delete("*/v1/scenes/:key/", () =>
      HttpResponse.json({ detail: "boom" }, { status: 500 }),
    ),
  );
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await chooseAction("Alpha", "Delete");
  const confirm = await screen.findByRole("alertdialog");
  await user.click(within(confirm).getByRole("button", { name: "Delete" }));

  expect(await within(confirm).findByRole("alert")).toHaveTextContent(
    "Couldn’t delete the scene.",
  );
  expect(confirm).toBeInTheDocument();
});

test("filtering announces the result count", async () => {
  const { owner } = seedScenes(["Alpha", "Beta", "Gamma"]);
  const { dialog } = await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  await user.type(screen.getByRole("textbox", { name: "Filter scenes" }), "a");

  await waitFor(() =>
    expect(within(dialog).getByRole("status")).toHaveTextContent("3 scenes"),
  );
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

test("cards show the scene's imageUrl as their thumbnail", async () => {
  const owner = seedDb.withUser();
  const imageUrl = "https://s.test/screenshots/scene/x.png?fallback=none&v=1";
  seedDb.withSceneFromItems([], {
    title: "Alpha",
    author: owner.id,
    imageUrl,
    modifiedDate: new Date(Date.UTC(2026, 0, 30)).toISOString(),
  });
  seedDb.withSceneFromItems([], {
    title: "Beta",
    author: owner.id,
    modifiedDate: new Date(Date.UTC(2026, 0, 29)).toISOString(),
  });
  await openMyScenes(owner);
  await screen.findByRole("link", { name: "Alpha" });

  const [alpha, beta] = screen.getAllByRole("listitem");
  expect(within(alpha).getByRole("presentation")).toHaveAttribute(
    "src",
    imageUrl,
  );
  expect(within(beta).queryByRole("presentation")).toBeNull();
});

test("an untitled scene's card reads Untitled", async () => {
  const { owner } = seedScenes([""]);
  await openMyScenes(owner);

  expect(
    await screen.findByRole("link", { name: "Untitled" }),
  ).toBeInTheDocument();
});
