import _ from "lodash";
import { MathItemType as MIT } from "@/configs";
import type { MathItem } from "@/configs";
import { makeItem, renderTestApp, seedDb, user, act } from "@/test_util";
import { getItemByDescription, findBtn } from "./__utils__";
import { mathScopeId } from "../mathScope";

const btnLabels = {
  pause: "Pause",
  play: "Play",
  faster: "Increase speed",
  slower: "Decrease speed",
  increment: "Step forward",
  decrement: "Step backward",
};

const setupTest = async (
  properties: Partial<MathItem<MIT.VariableSlider>["properties"]> = {}
) => {
  const item = makeItem(MIT.VariableSlider, properties);
  const scene = seedDb.withSceneFromItems([item]);
  const { store } = await renderTestApp(`/${scene.id}`);

  const itemEl = getItemByDescription(item.properties.description);
  const btnToggle = await findBtn(itemEl, /(Pause)|(Play)/);
  const btnFaster = await findBtn(itemEl, btnLabels.faster);
  const btnSlower = await findBtn(itemEl, btnLabels.slower);
  const btnIncrement = await findBtn(itemEl, btnLabels.increment);
  const btnDecremet = await findBtn(itemEl, btnLabels.decrement);

  const el = {
    item: itemEl,
    btnToggle,
    btnFaster,
    btnSlower,
    btnIncrement,
    btnDecremet,
  };

  const valueUpdates: number[] = [];
  const valueId = mathScopeId(item.id, "value");
  const mathScope = store.getState().mathItems.mathScope();
  mathScope.addEventListener("change", (e) => {
    if (e.changes.results.updated.has(mathScopeId(item.id, "value"))) {
      const value = mathScope.results.get(valueId);
      if (typeof value !== "number") {
        throw new Error(`Value should be a number; received ${value}`);
      }
      valueUpdates.push(value);
    }
  });

  const getValueResult = () => mathScope.results.get(valueId);
  const getValueError = (type: "parse" | "eval") =>
    type === "parse"
      ? mathScope.parseErrors.get(valueId)
      : mathScope.evalErrors.get(valueId);

  return {
    store,
    el,
    item,
    valueUpdates,
    getValueResult,
    getValueError,
  };
};

const sleep = async (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

test("left-hand parse errors are indicated on left-hand side", async () => {
  const { getValueResult, el, valueUpdates } = await setupTest({ fps: "10" });

  await user.click(el.btnToggle);

  await act(() => sleep(1000));
  await user.click(el.btnToggle);
  console.log(valueUpdates.length);
});
