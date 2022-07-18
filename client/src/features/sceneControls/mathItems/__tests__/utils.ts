import { MathItemType as MIT, MathItem } from "configs";
import { keyBy, zip } from "lodash";
import { RootState } from "store/store";
import { screen, within, user, makeItem } from "test_util";

const addItem = async (itemLabel: string): Promise<void> => {
  const addNewItemButton = screen.getByText("Add New Object");
  await user.click(addNewItemButton);
  const menu = await screen.findByRole("menu");
  const itemType = await within(menu).findByText(itemLabel);
  await user.click(itemType);
};

const getItemByDescription = (description: string): HTMLElement =>
  screen.getByTitle(`Settings for ${description}`);

/**
 * Creates a store patch with 6 points distributed between 3 folders
 * with labels:
 * - folder `"F1"` with points `["P1a", "P1b"]`
 * - folder `"F2"` with points `["P2a", "P2b"]`
 * - folder `"F3"` with points `["P3a", "P3b"]`
 *
 */
const folderFixture = ({
  F1 = {},
  F2 = {},
  F3 = {},
}: {
  F1?: Partial<MathItem<MIT.Folder>["properties"]>;
  F2?: Partial<MathItem<MIT.Folder>["properties"]>;
  F3?: Partial<MathItem<MIT.Folder>["properties"]>;
} = {}): Partial<RootState> => {
  const folderProps = { F1, F2, F3 };
  const pointDescriptions = ["P1a", "P1b", "P2a", "P2b", "P3a", "P3b"];
  const folderDescriptions = ["F1", "F2", "F3"] as const;
  const points = pointDescriptions.map((description) =>
    makeItem(MIT.Point, { description })
  );
  const folders = folderDescriptions.map((description) =>
    makeItem(MIT.Folder, { description, ...folderProps[description] })
  );
  const items = keyBy([...points, ...folders], (item) => item.id);
  const [p0, p1, p2, p3, p4, p5] = points.map((p) => p.id);
  const [f0, f1, f2] = folders.map((f) => f.id);
  return {
    mathItems: {
      items,
      activeItemId: undefined,
      order: {
        setup: [],
        main: [f0, f1, f2],
        [f0]: [p0, p1],
        [f1]: [p2, p3],
        [f2]: [p4, p5],
      },
    },
    itemOrder: {
      activeItemId: undefined,
      tree: {
        setup: [],
        main: [f0, f1, f2],
        [f0]: [p0, p1],
        [f1]: [p2, p3],
        [f2]: [p4, p5],
      },
    },
  };
};

export { addItem, getItemByDescription, folderFixture };
