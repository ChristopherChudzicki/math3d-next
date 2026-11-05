import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isMathGraphic } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import {
  finalVisibility,
  mathScopeId,
} from "@/store/scene/evaluation/mathScope";
import {
  renderGraphicSpec,
  storeWithScene,
} from "@/test_util/renderGraphicSpec";
import type { SceneInput } from "@/test_util/renderGraphicSpec";

const QA_DIR = path.resolve(
  import.meta.dirname,
  "../../../../../../../webserver/scenes/seed_scenes/qa",
);

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
    const isVisible = (item: MathItem) =>
      isMathGraphic(item) &&
      finalVisibility(
        item,
        scope.results.get(mathScopeId(item.id, "calculatedVisibility")),
      );
    const missing = scene.items
      .filter(isVisible)
      .filter((item) => renderGraphicSpec(scene, item.id) === null)
      .map((item) => item.id);
    expect(missing).toEqual([]);
  },
);
