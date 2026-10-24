import { parseFrontMatter } from "./parseFrontMatter";

describe("parseFrontMatter", () => {
  test("parses the leading YAML block and returns the rest as the body", () => {
    expect(parseFrontMatter("---\nname: sine\n---\nBody\n---\n")).toEqual({
      frontmatter: { name: "sine" },
      body: "Body\n---\n",
    });
  });

  test("a file without front matter is all body", () => {
    expect(parseFrontMatter("Body\n")).toEqual({
      frontmatter: undefined,
      body: "Body\n",
    });
  });
});
