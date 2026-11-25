import { mathItemConfigs, MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import { MAIN_FOLDER, SETTINGS_FOLDER } from "@/store/scene/state/util";

type StoredContent = {
  items: MathItem[];
  itemOrder: Record<string, string[]>;
};

const sameKeys = (a: object, b: object) => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  return (
    aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i])
  );
};

const hasSceneShape = ({ items, itemOrder }: StoredContent): boolean => {
  const byId = new Map(items.map((item) => [item.id, item]));
  const itemsOk = items.every((item) => {
    const config = mathItemConfigs[item.type as MathItemType];
    return (
      config !== undefined &&
      typeof item.properties === "object" &&
      item.properties !== null &&
      sameKeys(item.properties, config.make(item.id).properties)
    );
  });
  if (!itemsOk) return false;

  if (!itemOrder[MAIN_FOLDER] || !itemOrder[SETTINGS_FOLDER]) return false;
  return Object.entries(itemOrder).every(([folderId, childIds]) => {
    const isRoot = folderId === MAIN_FOLDER || folderId === SETTINGS_FOLDER;
    const folder = byId.get(folderId);
    // A deleted folder's key outlives it in saved scenes; it's harmless.
    if (!isRoot && folder === undefined) return true;
    if (!isRoot && folder?.type !== MathItemType.Folder) return false;
    return Array.isArray(childIds) && childIds.every((id) => byId.has(id));
  });
};

/**
 * Whether stored content matches today's item configs exactly and has a
 * well-formed order. Drafts aren't migrated when configs change, so one written
 * before such a change fails this.
 */
const isRestorable = (content: StoredContent): boolean => {
  try {
    return hasSceneShape(content);
  } catch {
    return false;
  }
};

export { isRestorable };
