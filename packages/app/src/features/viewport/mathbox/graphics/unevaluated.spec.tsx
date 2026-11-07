import React from "react";
import { vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import invariant from "tiny-invariant";
import { SceneBuilder } from "@math3d/mock-api";
import { isMathGraphic } from "@math3d/mathitem-configs";
import { getStore } from "@/store/store";
import { actions } from "@/store/scene/state/scene.slice";
import { Graphic } from "./Graphic";

type Folder = ReturnType<SceneBuilder["folder"]>;

const nan = "\\left[0,\\frac{0}{0},0\\right]";
const point = (valid: boolean) => (valid ? "\\left[1,1,1\\right]" : nan);
const interval = (valid: boolean) =>
  valid ? "\\left[-1,1\\right]" : "\\left[-1,q\\right]";

const cases = [
  {
    name: "a point's coordinates",
    add: (f: Folder, id: string, valid: boolean) =>
      f.point({ coords: point(valid) }, id),
  },
  {
    name: "a line's coordinates",
    add: (f: Folder, id: string, valid: boolean) =>
      f.line(
        { coords: `\\left[${point(valid)},\\left[0,0,0\\right]\\right]` },
        id,
      ),
  },
  {
    name: "a vector's components",
    add: (f: Folder, id: string, valid: boolean) =>
      f.vector({ components: point(valid) }, id),
  },
  {
    name: "a surface's domain",
    add: (f: Folder, id: string, valid: boolean) =>
      f.parametricSurface(
        {
          domain: {
            type: "array",
            items: [
              {
                type: "function-assignment",
                name: "_f",
                params: ["v"],
                rhs: interval(valid),
              },
              {
                type: "function-assignment",
                name: "_f",
                params: ["u"],
                rhs: interval(true),
              },
            ],
          },
        },
        id,
      ),
  },
  {
    name: "a vector field's domain",
    add: (f: Folder, id: string, valid: boolean) =>
      f.vectorField(
        {
          domain: {
            type: "array",
            items: [interval(valid), interval(true), interval(true)].map(
              (expr) => ({ type: "expr" as const, expr }),
            ),
          },
        },
        id,
      ),
  },
];

test.each(cases)(
  "a graphic draws nothing until $name evaluate",
  async ({ add }) => {
    const scene = new SceneBuilder();
    const folder = scene.folder();
    add(folder, "good", true);
    add(folder, "bad", false);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = getStore();
    store.dispatch(actions.setScene({ ...scene, order: scene.itemOrder }));
    const graphic = (id: string) => {
      const item = scene.items.find((x) => x.id === id);
      invariant(item && isMathGraphic(item));
      return <Graphic item={item} />;
    };
    render(
      <Provider store={store}>
        <div data-testid="good">{graphic("good")}</div>
        <div data-testid="bad">{graphic("bad")}</div>
      </Provider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("good")).not.toBeEmptyDOMElement(),
    );
    expect(screen.getByTestId("bad")).toBeEmptyDOMElement();
  },
);
