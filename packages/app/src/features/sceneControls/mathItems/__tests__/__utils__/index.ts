import type { MathItemType, MathItem } from "@/configs";
import {
  screen,
  within,
  user,
  assertInstanceOf,
  makeItem,
  seedDb,
  renderTestApp,
} from "@/test_util";
import invariant from "tiny-invariant";

const addItem = async (itemTypeLabel: string): Promise<void> => {
  const addNewItemButton = screen.getByText("Add New Object");
  await user.click(addNewItemButton);
  const menu = await screen.findByRole("menu");
  const itemType = await within(menu).findByText(itemTypeLabel);
  await user.click(itemType);
};

const getItemByDescription = (description: string): HTMLElement =>
  screen.getByLabelText(`Settings for ${description}`);

const findItemByDescription = (description: string): Promise<HTMLElement> =>
  screen.findByLabelText(`Settings for ${description}`);

const clickRemoveItem = async (itemElement: HTMLElement): Promise<void> => {
  const remove = within(itemElement).getByLabelText("Remove Item");
  await user.click(remove);
};

const findBtn = async (item: HTMLElement, name: string | RegExp) => {
  const btn = await within(item).findByRole("button", { name });
  assertInstanceOf(btn, HTMLButtonElement);
  return btn;
};

/**
 * Renders test app with specified item
 */
const setupItemTest = async <T extends MathItemType>(
  type: T,
  props: Partial<MathItem<T>["properties"]> = {}
) => {
  const item = makeItem(type, props);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const form = await findItemByDescription(item.properties.description);
  invariant(
    form instanceof HTMLFormElement,
    "Expected item form to be an HTMLFormElement"
  );
  return { item, form, store };
};

export {
  addItem,
  clickRemoveItem,
  getItemByDescription,
  findItemByDescription,
  findBtn,
  setupItemTest,
};
