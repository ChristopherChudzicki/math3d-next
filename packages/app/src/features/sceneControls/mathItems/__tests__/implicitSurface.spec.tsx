import {
  MathItem,
  MathItemType as MIT,
  mathItemConfigs,
} from "@math3d/mathitem-configs";
import {
  assertInstanceOf,
  makeItem,
  renderTestApp,
  screen,
  seedDb,
  user,
} from "@/test_util";

const config = mathItemConfigs[MIT.ImplicitSurface];

const getParamNameInputs = (): HTMLTextAreaElement[] => {
  const zeroth = screen.getByLabelText("Name for 1st parameter");
  const first = screen.getByLabelText("Name for 2nd parameter");
  const second = screen.getByLabelText("Name for 3rd parameter");
  assertInstanceOf(zeroth, HTMLTextAreaElement);
  assertInstanceOf(first, HTMLTextAreaElement);
  assertInstanceOf(second, HTMLTextAreaElement);
  return [zeroth, first, second];
};

test("Updating parameter names updates the lhs and rhs appropriately", async () => {
  const lhs = {
    initial: {
      type: "function-assignment" as const,
      name: "_f",
      params: ["x", "y", "z"],
      rhs: "x + y + z",
    },
    final: {
      type: "function-assignment" as const,
      name: "_f",
      params: ["a1", "y", "z"],
      rhs: "x + y + z",
    },
  };
  const rhs = {
    initial: {
      type: "function-assignment" as const,
      name: "_f",
      params: ["x", "y", "z"],
      rhs: "x * y * z",
    },
    final: {
      type: "function-assignment" as const,
      name: "_f",
      params: ["a1", "y", "z"],
      rhs: "x * y * z",
    },
  };
  const item = makeItem(MIT.ImplicitSurface, {
    lhs: lhs.initial,
    rhs: rhs.initial,
  });
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.key}`);
  const mathScope = store.getState().mathItems.mathScope();
  const [paramInput] = getParamNameInputs();
  await user.clear(paramInput);
  await user.click(paramInput);
  await user.paste("a1");
  expect(mathScope.errors.size).toBe(2);
  const newItem = store.getState().mathItems.items[
    item.id
  ] as MathItem<MIT.ImplicitSurface>;
  expect(newItem.properties.rhs).toEqual(rhs.final);
  expect(newItem.properties.lhs).toEqual(lhs.final);
});

test.each([{ name: "lhs" as const }, { name: "rhs" as const }])(
  "Updating parameter names updates the lhs and rhs appropriately",
  async ({ name }) => {
    const initial = {
      type: "function-assignment" as const,
      name: "_f",
      params: ["x", "y", "z"],
      rhs: "x + y + z",
    };
    const initialDisplay = "x + y + z";
    const final = {
      type: "function-assignment" as const,
      name: "_f",
      params: ["x", "y", "z"],
      rhs: "x + y + z^2",
    };
    const finalDisplay = "x + y + z^2";

    const item = makeItem(MIT.ImplicitSurface, {
      [name]: initial,
    });
    const scene = seedDb.withSceneFromItems([item]);
    const { store } = await renderTestApp(`/${scene.key}`);

    const input = screen.getByLabelText(
      config.properties[name].label,
    ) as HTMLInputElement;
    expect(input.value).toBe(initialDisplay);
    await user.clear(input);
    await user.click(input);
    await user.paste(finalDisplay);
    expect(input.value).toBe(finalDisplay);

    const newItem = store.getState().mathItems.items[
      item.id
    ] as MathItem<MIT.ImplicitSurface>;
    expect(newItem.properties[name]).toEqual(final);
  },
);
