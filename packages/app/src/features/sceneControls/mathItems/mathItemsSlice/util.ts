import { MathItemsState } from "./interfaces";

const MAIN_FOLDER = "main";
const SETTINGS_FOLDER = "setup";

const getParent = (
  order: MathItemsState["order"],
  itemId: string,
): string | null => {
  const parentFolderId = Object.keys(order).find((folderId) => {
    return order[folderId].includes(itemId);
  });
  if (parentFolderId === undefined) return null;
  return parentFolderId;
};

const isDescendantOf = (
  order: MathItemsState["order"],
  id: string,
  candidateAncestor: string,
): boolean => {
  const parent = getParent(order, id);
  if (parent === candidateAncestor) return true;
  if (parent === null) return false;
  return isDescendantOf(order, parent, candidateAncestor);
};

export { isDescendantOf, MAIN_FOLDER, SETTINGS_FOLDER };
