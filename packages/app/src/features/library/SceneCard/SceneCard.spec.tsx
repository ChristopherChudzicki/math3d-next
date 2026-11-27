import React, { useState } from "react";
import { act, fireEvent, screen, within } from "@testing-library/react";
import user from "@testing-library/user-event";
import { ListType } from "@/services/overlays/search";
import { renderWithRouter } from "@/test_util/routerTesting";
import { sceneCardLink } from "@/features/library/useSceneLinks";
import SceneCard from "./SceneCard";
import type { SceneCardProps } from "./SceneCard";

const link = sceneCardLink("abc", {
  overlay: "scenes",
  list: ListType.Examples,
});

const setupCard = async (props: Partial<SceneCardProps> = {}) => {
  const { router } = await renderWithRouter(
    <ul>
      <SceneCard title="Parametric surfaces" link={link} {...props} />
    </ul>,
    { url: "/start" },
  );
  return router;
};

test("the link is named by the title alone and described by the meta line", async () => {
  await setupCard({
    modifiedDate: "2026-09-01T12:00:00Z",
    archived: true,
    current: true,
  });

  const anchor = screen.getByRole("link", { name: "Parametric surfaces" });
  expect(anchor).toHaveAttribute("href", "/abc?overlay=scenes&list=examples");
  expect(anchor).toHaveAttribute("aria-current", "page");
  expect(anchor).toHaveAccessibleDescription(/Last modified.*Archived/);
});

test("actions are a sibling of the link, not inside it", async () => {
  await setupCard({ actions: <button type="button">Actions</button> });

  const anchor = screen.getByRole("link", { name: "Parametric surfaces" });
  expect(within(anchor).queryByRole("button")).toBeNull();
  expect(screen.getByRole("button", { name: "Actions" })).toBeInTheDocument();
});

test("a plain click on the current scene's card doesn't navigate", async () => {
  const router = await setupCard({ current: true });

  await user.click(screen.getByRole("link", { name: "Parametric surfaces" }));

  expect(router.state.location.pathname).toBe("/start");
});

describe("the thumbnail", () => {
  const IMAGE_URL = "https://s.test/screenshots/scene/abc.png?fallback=none";
  // alt="" gives the <img> the presentation role. The placeholder beneath it
  // is always rendered; without the <img>, it is all that shows.
  const thumbnail = () => screen.queryByRole("presentation");

  test("is hidden until it loads, then revealed", async () => {
    await setupCard({ imageUrl: IMAGE_URL });
    const img = screen.getByRole("presentation");
    expect(img).toHaveAttribute("src", IMAGE_URL);
    expect(img).toHaveAttribute("loading", "lazy");
    expect(img).not.toHaveAttribute("data-loaded");

    fireEvent.load(img);

    expect(img).toHaveAttribute("data-loaded");
  });

  test("goes away on error, leaving the placeholder", async () => {
    await setupCard({ imageUrl: IMAGE_URL });

    fireEvent.error(screen.getByRole("presentation"));

    expect(thumbnail()).toBeNull();
  });

  test("starts over when its URL changes, e.g. after the scene is saved", async () => {
    let setImageUrl: (url: string) => void = () => {};
    const Card: React.FC = () => {
      const [imageUrl, set] = useState(`${IMAGE_URL}&v=1`);
      setImageUrl = set;
      return (
        <ul>
          <SceneCard
            title="Parametric surfaces"
            link={link}
            imageUrl={imageUrl}
          />
        </ul>
      );
    };
    await renderWithRouter(<Card />);
    fireEvent.error(screen.getByRole("presentation"));
    expect(thumbnail()).toBeNull();

    act(() => setImageUrl(`${IMAGE_URL}&v=2`));

    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      `${IMAGE_URL}&v=2`,
    );
  });

  test("is absent without an imageUrl, leaving the placeholder", async () => {
    await setupCard({ imageUrl: null });

    expect(thumbnail()).toBeNull();
  });
});
