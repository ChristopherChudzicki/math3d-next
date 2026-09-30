/** The header button that opens the scenes dialog; focus returns to it on close. */
export const OPEN_SCENES_BUTTON_ID = "open-scenes-button";

export enum ListType {
  Examples = "examples",
  Me = "me",
}

/** A card's link: opens the scene with the drawer still open on its tab. */
export const sceneHref = (key: string, list: ListType) =>
  `/${key}?overlay=scenes&list=${list}`;
