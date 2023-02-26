import {
  MathItem,
  mathItemConfigs,
  MathItemType,
} from "@math3d/mathitem-configs";
import idGenerator from "@/util/idGenerator";

const makeItem = <T extends MathItemType>(
  type: T,
  props: Partial<MathItem<T>["properties"]> = {}
): MathItem<T> => {
  const id = idGenerator.next();
  const item = mathItemConfigs[type].make(id) as MathItem<T>;
  item.properties = {
    ...item.properties,
    ...props,
  };
  return item;
};

export { makeItem };
