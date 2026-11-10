import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { isMathGraphic } from "@math3d/mathitem-configs";
import type { MathItem } from "@math3d/mathitem-configs";
import {
  finalVisibility,
  mathScopeId,
} from "@/store/scene/evaluation/mathScope";
import {
  collectGraphicSpecs,
  storeWithScene,
} from "@/test_util/renderGraphicSpec";
import type { SceneInput } from "@/test_util/renderGraphicSpec";
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
