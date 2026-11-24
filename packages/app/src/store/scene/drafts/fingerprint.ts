import { MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";

type SceneContent = {
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
};

/**
 * Properties that change while someone is only looking at a scene. They are
 * saved with the scene, but changing them doesn't make a draft worth keeping.
 */
const maskProperties = (item: MathItem): Record<string, unknown> => {
  const properties: Record<string, unknown> = { ...item.properties };
  if (item.type === MathItemType.Camera) {
    delete properties.position;
    delete properties.target;
  } else if (item.type === MathItemType.VariableSlider) {
    // `lhs` is the variable's name, a real edit; `rhs` is where the slider sits.
    const { lhs } = item.properties.value;
    properties.value = { lhs };
    delete properties.isAnimating;
  } else if (item.type === MathItemType.Folder) {
    delete properties.isCollapsed;
  }
  return properties;
};

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    );
  }
  return value;
};

/**
 * A stable string for comparing scenes, ignoring camera position, slider
 * values and folder collapse. Equal strings mean nothing worth a draft changed.
 */
const sceneFingerprint = ({ title, items, itemOrder }: SceneContent): string =>
  JSON.stringify(
    sortKeys({
      title,
      itemOrder,
      items: [...items]
        .sort((a, b) => (a.id < b.id ? -1 : Number(a.id > b.id)))
        .map((item) => ({
          id: item.id,
          type: item.type,
          properties: maskProperties(item),
        })),
    }),
  );

export { sceneFingerprint };
export type { SceneContent };
