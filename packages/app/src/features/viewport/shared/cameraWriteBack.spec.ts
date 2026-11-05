import { cameraPatches } from "./cameraWriteBack";

const prev = { position: [1, 2, 3], target: [0, 0, 0] } as const;

test("cameraPatches is null when the camera did not move", () => {
  expect(
    cameraPatches(prev, { position: [1, 2, 3 + 1e-9], target: [0, 0, 0] }),
  ).toBeNull();
});

test("cameraPatches writes both position and target when the camera moved", () => {
  expect(
    cameraPatches(prev, { position: [1 / 3, 2, 3], target: [0, 0, 0] }),
  ).toEqual([
    { path: "/position", value: "[0.333333,2.00000,3.00000]" },
    { path: "/target", value: "[0.00000,0.00000,0.00000]" },
  ]);
});

test("cameraPatches writes when there was no stored position", () => {
  expect(
    cameraPatches(
      { position: undefined, target: [0, 0, 0] },
      { position: [1, 2, 3], target: [0, 0, 0] },
    ),
  ).not.toBeNull();
});

test("cameraPatches writes when only the target moved", () => {
  expect(
    cameraPatches(prev, { position: [1, 2, 3], target: [0, 0, 1] }),
  ).not.toBeNull();
});
