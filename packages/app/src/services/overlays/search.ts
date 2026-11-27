import { string } from "yup";

export const OVERLAY_NAMES = ["logout", "delete-account", "scenes"] as const;
export type OverlayName = (typeof OVERLAY_NAMES)[number];

/** The Scenes overlay's tab. */
export const ListType = {
  Examples: "examples",
  Me: "me",
  Unsaved: "unsaved",
} as const;
// eslint-disable-next-line @typescript-eslint/no-redeclare -- the value and its type, as an enum's
export type ListType = (typeof ListType)[keyof typeof ListType];

/** `?overlay=` and its `?list=` tab; `?signin` opens sign-in above them. */
export const overlaySearchFields = {
  overlay: string().oneOf(OVERLAY_NAMES),
  list: string().oneOf(Object.values(ListType)),
  signin: string(),
};
