import { mathItemConfigs, MathItemType } from "@math3d/mathitem-configs";
import { MAIN_FOLDER, SETTINGS_FOLDER } from "@/store/scene/state/util";
import type { DraftRecord } from "@/store/scene/drafts/storage";

const sameKeys = (a: object, b: object) => {
  const aKeys = Object.keys(a).sort();
  const bKeys = Object.keys(b).sort();
  return (
    aKeys.length === bKeys.length && aKeys.every((key, i) => key === bKeys[i])
  );
};

const hasSceneShape = (record: DraftRecord): boolean => {
  const items = new Map(record.items.map((item) => [item.id, item]));
  const itemsOk = record.items.every((item) => {
    const config = mathItemConfigs[item.type as MathItemType];
    return (
      config !== undefined &&
      typeof item.properties === "object" &&
      item.properties !== null &&
      sameKeys(item.properties, config.make(item.id).properties)
    );
  });
  if (!itemsOk) return false;

  const order = record.itemOrder;
  if (!order[MAIN_FOLDER] || !order[SETTINGS_FOLDER]) return false;
  return Object.entries(order).every(([folderId, childIds]) => {
    const isRoot = folderId === MAIN_FOLDER || folderId === SETTINGS_FOLDER;
    if (!isRoot && items.get(folderId)?.type !== MathItemType.Folder) {
      return false;
    }
    return Array.isArray(childIds) && childIds.every((id) => items.has(id));
  });
};

/**
 * Whether a stored draft still has the shape `setScene` expects. Drafts are
 * not migrated when item configs change, so an old one can fail this.
 */
const isRestorableDraft = (record: DraftRecord): boolean => {
  try {
    return hasSceneShape(record);
  } catch {
    return false;
  }
};

export { isRestorableDraft };
