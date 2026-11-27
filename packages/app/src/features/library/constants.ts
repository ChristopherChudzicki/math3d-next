import { UNTITLED, sceneDisplayName } from "@/store/scene/sceneTitle";

/** The header button that opens the scenes dialog; focus returns to it on close. */
export const OPEN_SCENES_BUTTON_ID = "open-scenes-button";

export const SCENES_DRAWER_SIZE = "lg";

/** A scene card's title. */
export const cardTitle = (title?: string | null) =>
  sceneDisplayName(title ?? "") ?? UNTITLED;
