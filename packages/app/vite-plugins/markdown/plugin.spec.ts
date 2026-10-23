import type { TransformResult } from "vite";
import { markdown } from "./plugin";

const transform = (source: string, id: string) => {
  const hook = markdown({ query: "doc" }).transform as (
    source: string,
    id: string,
  ) => TransformResult | null;
  return hook(source, id);
};

describe("markdown plugin", () => {
  test("by default exports the front matter and rendered body", () => {
    const result = transform("---\ntitle: Hi\n---\n*Body*\n", "/a.md?doc");
    expect(result?.code).toBe(
      `export default ${JSON.stringify({
        frontmatter: { title: "Hi" },
        html: "<p><em>Body</em></p>\n",
      })};`,
    );
  });

  test("leaves markdown imported without its query alone", () => {
    expect(transform("*Body*\n", "/a.md")).toBeNull();
  });
});
