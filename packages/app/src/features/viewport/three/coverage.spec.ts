import type { Coverage } from "@/features/viewport/shared/coverage";
import { coverage } from "./coverage";

test("every three.js property is classified", () => {
  const todos = Object.entries(coverage).flatMap(([type, properties]) =>
    Object.entries<Coverage>(properties)
      .filter(([, status]) => status === "todo")
      .map(([property]) => `${type}.${property}`),
  );
  expect(todos).toEqual([]);
});
