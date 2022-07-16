import { screen, within, user } from "test_util";
import { assertNotNil } from "util/predicates";

const addItem = async (itemLabel: string): Promise<void> => {
  const addNewItemButton = screen.getByText("Add New Object");
  await user.click(addNewItemButton);
  const menu = await screen.findByRole("menu");
  const itemType = await within(menu).findByText(itemLabel);
  await user.click(itemType);
};

const getItemByDescription = (description: string): HTMLElement =>
  screen.getByTitle(`Settings for ${description}`);

export { addItem, getItemByDescription };
