import { MathItemType as MIT, MathItem } from "configs";
import { keyBy } from "lodash";
import { screen, within, user, makeItem, StatePatch } from "test_util";

const addItem = async (itemTypeLabel: string): Promise<void> => {
  const addNewItemButton = screen.getByText("Add New Object");
  await user.click(addNewItemButton);
  const menu = await screen.findByRole("menu");
  const itemType = await within(menu).findByText(itemTypeLabel);
  await user.click(itemType);
};

const getItemByDescription = (description: string): HTMLElement =>
  screen.getByTitle(`Settings for ${description}`);

const clickRemoveItem = async (itemElement: HTMLElement): Promise<void> => {
  const remove = within(itemElement).getByLabelText("Remove Item");
  await user.click(remove);
};

export { addItem, clickRemoveItem, getItemByDescription };
