import type {
  GraphicSpec,
  ImplicitSurfaceSpec,
  ViewportSpec,
} from "@math3d/viewport-spec";
import { withoutBatchedForms } from "./batchFlag";

const viewport = (graphics: ViewportSpec["graphics"]) =>
  ({ graphics }) as ViewportSpec;

const implicit = {
  kind: "implicit",
  value: () => 0,
  values: () => undefined,
} as unknown as ImplicitSurfaceSpec;
const surface = { kind: "surface" } as GraphicSpec;

test("removes `values` from an implicit surface and leaves other graphics as they are", () => {
  const { graphics } = withoutBatchedForms(
    viewport([
      { id: "a", spec: implicit },
      { id: "b", spec: surface },
    ]),
  );
  expect(graphics.map(({ id }) => id)).toEqual(["a", "b"]);
  expect(graphics[0].spec).toEqual({ kind: "implicit", value: implicit.value });
  expect(graphics[1].spec).toBe(surface);
});

test("an unchanged implicit spec keeps its identity across calls", () => {
  const first = withoutBatchedForms(viewport([{ id: "a", spec: implicit }]));
  const second = withoutBatchedForms(viewport([{ id: "a", spec: implicit }]));
  expect(second.graphics[0].spec).toBe(first.graphics[0].spec);
});
