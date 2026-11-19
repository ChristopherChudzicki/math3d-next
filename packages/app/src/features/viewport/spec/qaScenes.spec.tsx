import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isMathGraphic, MathItemType } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import {
  finalVisibility,
  mathScopeId,
} from "@/store/scene/evaluation/mathScope";
import { collectGraphicSpecs } from "@/test_util/renderGraphicSpec";
import { storeWithScene } from "@/test_util/storeWithScene";
import type { SceneInput } from "@/test_util/storeWithScene";
import { repoRoot } from "@/test_util/repoRoot";

const QA_DIR = path.join(repoRoot, "webserver/scenes/seed_scenes/qa");

type QaScene = {
  key: string;
  title: string;
  items: MathItem[];
  itemOrder: Record<string, string[]>;
};

const qaScenes: SceneInput[] = readdirSync(QA_DIR)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const scene: QaScene = JSON.parse(
      readFileSync(path.join(QA_DIR, file), "utf8"),
    );
    return { ...scene, isLegacy: false, author: null };
  });

test.each(qaScenes.map((scene) => ({ key: scene.key, scene })))(
  "every visible graphic in QA scene $key produces a spec",
  ({ scene }) => {
    const scope = storeWithScene(scene).mathScope.get();
    const isVisible = (item: MathItem) => {
      const id = mathScopeId(item.id, "calculatedVisibility");
      return (
        isMathGraphic(item) &&
        finalVisibility(item, scope.results.get(id), scope.errors.get(id))
      );
    };
    const visible = scene.items.filter(isVisible).map((item) => item.id);
    const specs = collectGraphicSpecs(scene, visible);
    const missing = visible.filter((id) => !specs[id]);
    expect(missing).toEqual([]);
  },
);

test("in the QA scenes, an implicit surface's `values` agree with its `value`", () => {
  const STEPS = 5;
  const lerp = ([lo, hi]: [number, number], i: number) =>
    lo + ((hi - lo) * i) / (STEPS - 1);
  let compared = 0;
  const mismatches: unknown[] = [];
  qaScenes.forEach((scene) => {
    const ids = scene.items
      .filter((item) => item.type === MathItemType.ImplicitSurface)
      .map((item) => item.id);
    if (ids.length === 0) return;
    const specs = collectGraphicSpecs(scene, ids);
    ids.forEach((id) => {
      const spec = specs[id];
      if (spec?.kind !== "implicit" || !spec.values) return;
      const points = Array.from({ length: STEPS ** 3 }, (_, n) => [
        lerp(spec.domain[0], n % STEPS),
        lerp(spec.domain[1], Math.floor(n / STEPS) % STEPS),
        lerp(spec.domain[2], Math.floor(n / STEPS ** 2)),
      ]);
      const result = spec.values(
        Float64Array.from(points, ([x]) => x),
        Float64Array.from(points, ([, y]) => y),
        Float64Array.from(points, ([, , z]) => z),
      );
      // Declining is always allowed: the renderer then calls `value`.
      if (!result) return;
      compared += 1;
      points.forEach(([x, y, z], n) => {
        const expected = spec.value(x, y, z);
        if (!Object.is(result[n], expected)) {
          mismatches.push({ scene: scene.key, id, x, y, z, expected });
        }
      });
    });
  });
  expect(mismatches).toEqual([]);
  expect(compared).toBeGreaterThan(0);
});
