import { UNTITLED, sceneDisplayName } from "@/store/scene/sceneTitle";

/** The header button that opens the scenes dialog; focus returns to it on close. */
export const OPEN_SCENES_BUTTON_ID = "open-scenes-button";

export enum ListType {
  Examples = "examples",
  Me = "me",
  Unsaved = "unsaved",
}

/**
 * A card's link. It keeps the drawer open on the card's tab, unless the drawer
 * covers the scene.
 */
export const sceneHref = (key: string, list: ListType, closeDrawer: boolean) =>
  closeDrawer ? `/${key}` : `/${key}?overlay=scenes&list=${list}`;

/** A scene card's title. */
export const cardTitle = (title?: string | null) =>
  sceneDisplayName(title ?? "") ?? UNTITLED;
