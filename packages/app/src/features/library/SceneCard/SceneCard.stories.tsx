import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemoryRouter } from "react-router";
import { Icon } from "@iconify/react/offline";
import moreVertical from "@iconify-icons/lucide/more-vertical";
import IconButton from "@/ui/IconButton";
import SceneCard from "./SceneCard";

const actions = (title: string) => (
  <IconButton label={`Actions for ${title}`} size="sm">
    <Icon icon={moreVertical} />
  </IconButton>
);

const IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 191 100"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#cfe3ff"/><stop offset="1" stop-color="#3090ff"/></linearGradient></defs><rect width="191" height="100" fill="url(#g)"/></svg>`,
)}`;

const cards = [
  {
    key: "a",
    title: "Parametric surfaces",
    modifiedDate: "2026-09-28T10:00:00Z",
  },
  {
    key: "b",
    title: "With an image",
    imageUrl: IMAGE,
    modifiedDate: "2026-09-20T10:00:00Z",
  },
  {
    key: "f",
    title: "Image fails to load (keeps the placeholder)",
    imageUrl: "data:image/png;base64,not-a-png",
    modifiedDate: "2026-09-18T10:00:00Z",
  },
  {
    key: "c",
    title: "Archived scene",
    archived: true,
    modifiedDate: "2026-08-01T10:00:00Z",
  },
  {
    key: "d",
    title: "The current scene",
    current: true,
    modifiedDate: "2026-09-29T10:00:00Z",
  },
  {
    key: "e",
    title:
      "A very long title that goes on and on, well past two lines, so it clamps with an ellipsis",
    modifiedDate: "2026-07-04T10:00:00Z",
  },
];

const AllSceneCards: React.FC = () => (
  <MemoryRouter>
    <p style={{ margin: "0 0 8px" }}>My Scenes (with meta and actions)</p>
    <ul
      role="list"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(14rem, 100%), 1fr))",
        gap: 16,
        padding: 0,
        margin: "0 0 24px",
        listStyle: "none",
      }}
    >
      {cards.map(({ key, ...card }) => (
        <SceneCard
          key={key}
          to={`/${key}`}
          actions={actions(card.title)}
          {...card}
        />
      ))}
    </ul>
    <p style={{ margin: "0 0 8px" }}>Examples (title only)</p>
    <ul
      role="list"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(14rem, 100%), 1fr))",
        gap: 16,
        padding: 0,
        margin: 0,
        listStyle: "none",
      }}
    >
      <SceneCard to="/sliders_intro" title="Using Variable Sliders" />
      <SceneCard to="/vectors" title="Vectors and Vector Tails" current />
    </ul>
  </MemoryRouter>
);

const meta: Meta<typeof AllSceneCards> = {
  title: "scenes/SceneCard",
  component: AllSceneCards,
};
export default meta;

export const AllVariants: StoryObj<typeof AllSceneCards> = {
  parameters: { layout: "padded" },
};
