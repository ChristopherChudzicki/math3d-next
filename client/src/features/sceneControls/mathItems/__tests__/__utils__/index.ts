import { screen, within, user, assertInstanceOf } from "@/test_util";

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

export {
  addItem,
  clickRemoveItem,
  getItemByDescription,
  findItemByDescription,
  findBtn,
};
