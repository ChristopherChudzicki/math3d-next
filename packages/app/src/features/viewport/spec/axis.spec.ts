import { SceneBuilder } from "@math3d/mock-api";
import { MathItemType as MIT } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import invariant from "tiny-invariant";
import { renderGraphicSpec } from "@/test_util/renderGraphicSpec";

test("an axis reports its range, ticks and label", () => {
  const scene = new SceneBuilder().axis("x", { divisions: "4" });
  const item = scene.items.find(
    (x): x is MathItem<MIT.Axis> => x.id === "axis-x" && x.type === MIT.Axis,
  );
  invariant(item, "axis-x not found");
  expect(renderGraphicSpec(scene, "axis-x")).toMatchObject({
    kind: "axis",
    range: [-5, 5],
    // MathBox's nice ticks over [-5, 5] step by 5; zero is left out.
    ticks: { divisions: 4, visible: true, values: [-5, 5] },
    label: item.properties.label,
  });
});
