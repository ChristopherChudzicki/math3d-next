import { MathItem, mathItemConfigs, MathItemType } from "configs";
import idGenerator from "util/idGenerator";

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

const testId = (itemId: string): string => `mathItem-${itemId}`;

export { makeItem, testId };
