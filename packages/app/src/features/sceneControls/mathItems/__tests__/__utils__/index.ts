import type { MathItemType, MathItem } from "@math3d/mathitem-configs";
import {
  screen,
  within,
  user,
  assertInstanceOf,
  renderTestApp,
} from "@/test_util";
import invariant from "tiny-invariant";
import type { RootState } from "@/store/store";
import { seedDb, makeItem } from "@math3d/mock-api";

const addItem = async (itemTypeLabel: string): Promise<void> => {
  const addNewItemButton = screen.getByText("Add Object");
  await user.click(addNewItemButton);
  const menu = await screen.findByRole("menu");
  const itemType = await within(menu).findByText(itemTypeLabel);
  await user.click(itemType);
};

const getItemByDescription = (description: string): HTMLElement =>
  screen.getByLabelText(`Settings for ${description}`);

const findItemByDescription = (description: string): Promise<HTMLElement> =>
  screen.findByLabelText(`Settings for ${description}`);

const getItemByTestId = (id: string): HTMLElement =>
  screen.getByTestId(`settings-${id}`);
const findItemByTestId = (id: string): Promise<HTMLElement> =>
  screen.findByTestId(`settings-${id}`);

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
  props: Partial<MathItem<T>["properties"]> = {},
) => {
  const item = makeItem(type, props);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.key}`);

  const form = await findItemByDescription(item.properties.description);
  invariant(
    form instanceof HTMLFormElement,
    "Expected item form to be an HTMLFormElement",
  );
  return { item, form, store };
};

const getActiveItem = (store: {
  getState: () => RootState;
}): MathItem | null => {
  const { activeItemId } = store.getState().scene;
  if (!activeItemId) return null;
  const item = store.getState().scene.items[activeItemId];
  return item;
};

export {
  addItem,
  clickRemoveItem,
  getItemByDescription,
  findItemByDescription,
  findBtn,
  setupItemTest,
  getActiveItem,
  getItemByTestId,
  findItemByTestId,
};
