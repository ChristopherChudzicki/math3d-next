import { createKnotProgress } from "./knotProgress";

test("closes the knot within 120 ms of the load finishing", () => {
  const progress = createKnotProgress();
  progress.setStage("building");
  expect(progress.step(1 / 60).finish).toBe(0);

  progress.setStage("done");
  let { finish } = progress.step(1 / 60);
  for (let frame = 1; frame < 8; frame += 1) {
    ({ finish } = progress.step(1 / 60));
  }

  expect(finish).toBe(1);
});
