import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Provider } from "react-redux";
import { screen, userEvent, within } from "storybook/test";
import { addableTypes, MathItemType as MIT } from "@math3d/mathitem-configs";
import { SceneBuilder } from "@math3d/mock-api";
import { getStore } from "@/store/store";
import type { AppStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import MathItemsList from "@/features/editor/items/MathItemsList/MathItemsList";
import SliderAnimations from "@/features/editor/items/forms/VariableSlider/SliderAnimations";
import styles from "./MathItemForms.stories.module.css";

type Column = { heading: string; rootId: "main" | "setup" };

type Args = {
  /** Column width in px; the desktop sidebar is 375. */
  width: number;
};

type SceneColumnsProps = Args & {
  build: () => SceneBuilder;
  setup?: (store: AppStore) => void;
  columns: Column[];
};

/**
 * `build()`'s scene in a real store, one per mount: arg changes keep edits,
 * Storybook's Remount resets them.
 */
const SceneColumns: React.FC<SceneColumnsProps> = ({
  build,
  setup,
  columns,
  width,
}) => {
  const [store] = useState(() => {
    const s = getStore();
    const scene = build();
    s.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
    setup?.(s);
    return s;
  });
  return (
    <Provider store={store}>
      <SliderAnimations />
      <div
        className={styles.columns}
        style={{ "--column-width": `${width}px` } as React.CSSProperties}
      >
        {columns.map(({ heading, rootId }) => (
          <section key={rootId} className={styles.column}>
            <h2 className={styles.heading}>{heading}</h2>
            <MathItemsList rootId={rootId} />
          </section>
        ))}
      </div>
    </Provider>
  );
};

const MAIN: Column = { heading: "Main tab", rootId: "main" };
const SETUP: Column = { heading: "Setup tab", rootId: "setup" };

const LONG_COORDS = String.raw`\left[\cos(1)+\frac{1}{2}\sin(2)+\frac{1}{3}\cos(3)+\frac{1}{4}\sin(4), \sin(1), 2\right]`;

const ACTIVE_ID = "active";

const buildAllItems = () => {
  const scene = new SceneBuilder().camera({
    description: "Camera: Pan set by an expression",
    isPanEnabled: "1 > 0",
  });
  const everyType = scene.folder({ description: "Every type" });
  addableTypes
    .filter((type) => type !== MIT.Folder)
    .forEach((type) => everyType.item(type));
  scene
    .folder({ description: "States" })
    .item(MIT.Point, { description: "Active item" }, ACTIVE_ID)
    .item(MIT.Point, { description: "Hidden graphic", visible: false })
    .item(MIT.ParametricSurface, {
      description: "Gradient color",
      color: "rainbow",
    })
    .item(MIT.Point, {
      description:
        "A long description that wraps onto a second line in the sidebar's narrow column",
    })
    .item(MIT.Point, {
      description: "Long expression",
      coords: LONG_COORDS,
    })
    .item(MIT.Variable, {
      description: "Matrix value",
      value: {
        type: "assignment",
        lhs: "M",
        rhs: String.raw`\left[\left[1, 2\right], \left[3, 4\right]\right]`,
      },
    })
    .item(MIT.Variable, {
      description: "Long name",
      value: {
        type: "assignment",
        lhs: "g(x_1, x_2, x_3, x_4, x_5)",
        rhs: "x_1 + x_2",
      },
    });
  scene
    .folder({ description: "Collapsed folder", isCollapsed: "true" })
    .item(MIT.Point);
  scene.folder({ description: "Empty folder" });
  return scene;
};

const buildErrors = () => {
  const scene = new SceneBuilder();
  scene
    .folder({ description: "Errors" })
    .item(MIT.Point, {
      description:
        "Point: 2D coordinates (parse and evaluation errors look the same)",
      coords: "[1, 2]",
    })
    .item(MIT.Variable, {
      description: "Variable: bad name",
      value: { type: "assignment", lhs: "a + ", rhs: "1" },
    })
    .item(MIT.Variable, {
      description: "Variable: bad value",
      value: { type: "assignment", lhs: "b", rhs: "1 + " },
    })
    .item(MIT.ParametricCurve, {
      description: "Curve: bad parameter name",
      expr: {
        type: "function-assignment",
        name: "_f",
        params: ["t + "],
        rhs: String.raw`\left[\cos(t), \sin(t), t\right]`,
      },
    })
    .item(MIT.ParametricSurface, {
      description: "Surface: one bad domain",
      domain: {
        type: "array",
        items: [
          {
            type: "function-assignment",
            name: "_f",
            params: ["v"],
            rhs: String.raw`\left[-3, \right]`,
          },
          {
            type: "function-assignment",
            name: "_f",
            params: ["u"],
            rhs: String.raw`\left[-\pi, \pi\right]`,
          },
        ],
      },
    })
    .item(MIT.ImplicitSurface, {
      description: "Implicit surface: bad left-hand side",
      lhs: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z"],
        rhs: "x^2 + ",
      },
    })
    .item(MIT.VariableSlider, {
      description: "Slider: one bad endpoint",
      value: { type: "assignment", lhs: "S", rhs: "0" },
      range: { type: "array", items: ["-5", "a + "] },
    })
    .item(MIT.VariableSlider, {
      description: "Slider: min ≥ max",
      value: { type: "assignment", lhs: "R", rhs: "0" },
      range: { type: "array", items: ["5", "-5"] },
    })
    .item(MIT.BooleanVariable, {
      description: "Toggle: bad value",
      value: { type: "assignment", lhs: "p", rhs: "1 > " },
    })
    .item(MIT.Camera, {
      description: "Camera: bad Pan expression",
      isPanEnabled: "1 > ",
    })
    .item(MIT.Axis, { description: "Axis: bad min", min: "1 + " });
  return scene;
};

const meta: Meta<Args> = {
  title: "editor/MathItemForms",
  args: { width: 375 },
  argTypes: { width: { control: { type: "range", min: 280, max: 600 } } },
};
export default meta;

type Story = StoryObj<Args>;

export const AllItems: Story = {
  render: (args) => (
    <SceneColumns
      build={buildAllItems}
      setup={(s) => s.dispatch(actions.setActiveItem({ id: ACTIVE_ID }))}
      columns={[MAIN, SETUP]}
      {...args}
    />
  ),
};

export const Errors: Story = {
  render: (args) => (
    <SceneColumns build={buildErrors} columns={[MAIN]} {...args} />
  ),
};

/**
 * One item with its settings popover open. Only one popover stays open at a
 * time, so each layout gets its own story; other types reuse `SettingsForm`
 * with different rows.
 */
const settingsStory = (
  addItem: (folder: ReturnType<SceneBuilder["folder"]>) => void,
  afterOpen?: () => Promise<void>,
): Story => {
  const build = () => {
    const scene = new SceneBuilder();
    addItem(scene.folder({ description: "Settings" }));
    return scene;
  };
  return {
    render: (args) => <SceneColumns build={build} columns={[MAIN]} {...args} />,
    play: async ({ canvasElement }) => {
      await userEvent.click(
        await within(canvasElement).findByRole("button", {
          name: "More Settings",
        }),
      );
      await afterOpen?.();
    },
  };
};

/** Widgets of each kind, with errors in the popover. */
export const AxisSettings = settingsStory((folder) =>
  folder.item(MIT.Axis, {
    calculatedVisibility: "1 + ",
    useCalculatedVisibility: true,
    ticksVisible: "1 > ",
  }),
);

/** A single field. */
export const SliderSettings = settingsStory((folder) =>
  folder.item(MIT.VariableSlider),
);

/** The color popup's Color Map tab, with an invalid color expression. */
export const ColorPopup = settingsStory(
  (folder) =>
    folder.item(MIT.ParametricSurface, {
      colorExpr: {
        type: "function-assignment",
        name: "_f",
        params: ["x", "y", "z", "u", "v"],
        rhs: "z + ",
      },
    }),
  async () => {
    const settings = await screen.findByRole("dialog", { name: /Settings$/ });
    await userEvent.click(
      within(settings).getByRole("button", { name: /^Color / }),
    );
    await userEvent.click(
      await screen.findByRole("tab", { name: "Color Map" }),
    );
  },
);
