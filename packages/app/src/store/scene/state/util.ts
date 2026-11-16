import type { MathGraphic } from "@math3d/mathitem-configs";
import { SceneState } from "./interfaces";

type VisibilityProperties = Pick<
  MathGraphic["properties"],
  "calculatedVisibility" | "useCalculatedVisibility"
>;

const hasCalculatedVisibility = (properties: VisibilityProperties) =>
  properties.calculatedVisibility.trim() !== "";

/**
 * What decides whether a graphic is shown: its Calculated Visibility
 * ("following"), or its `visible` toggle, because the user set it by hand
 * ("manual") or because there's no expression ("none").
 */
const visibilityMode = (
  properties: VisibilityProperties,
): "following" | "manual" | "none" => {
  if (!hasCalculatedVisibility(properties)) return "none";
  return properties.useCalculatedVisibility ? "following" : "manual";
};

const MAIN_FOLDER = "main";
const SETTINGS_FOLDER = "setup";

const getParent = (
  order: SceneState["order"],
  itemId: string,
): string | null => {
  const parentFolderId = Object.keys(order).find((folderId) => {
    return order[folderId].includes(itemId);
  });
  if (parentFolderId === undefined) return null;
  return parentFolderId;
};

const isDescendantOf = (
  order: SceneState["order"],
  id: string,
  candidateAncestor: string,
): boolean => {
  const parent = getParent(order, id);
  if (parent === candidateAncestor) return true;
  if (parent === null) return false;
  return isDescendantOf(order, parent, candidateAncestor);
};

export {
  hasCalculatedVisibility,
  isDescendantOf,
  MAIN_FOLDER,
  SETTINGS_FOLDER,
  visibilityMode,
};
