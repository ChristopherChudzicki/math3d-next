/**
 * Pass 2c keeps these names in error templates and replaces any other name,
 * which may be the user's, so the list must cover math3d-next's scope.
 */
import * as fs from "node:fs";
import { expect, it } from "vitest";
import math from "@math3d/custom-mathjs";

const names: string[] = JSON.parse(
  fs.readFileSync(
    new URL(
      "../../../webserver/scenes/legacy_audit/fixtures/function_names.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

it("names every builtin in math3d-next's scope", () => {
  const scope = Object.keys(
    // @ts-expect-error mathWithTransform is not in mathjs's types
    math.expression.mathWithTransform,
  );
  expect(scope.filter((name) => !names.includes(name))).toEqual([]);
});
