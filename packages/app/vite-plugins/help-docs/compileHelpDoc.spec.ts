import { convertLatexToMarkup } from "mathlive";
import { compileHelpDoc } from "./compileHelpDoc";

const compile = compileHelpDoc({
  docsRoot: "/docs",
  groups: ["trig", "calculus"],
});

const frontmatter = {
  name: "gradient",
  latex: "\\operatorname{grad}(f)",
  keyboard: "grad(f)",
  summary: "Total derivative of \\(f\\).",
  tags: ["calculus"],
};

describe("compileHelpDoc", () => {
  test("renders the front matter and body of a valid doc", () => {
    const inline = (latex: string) =>
      convertLatexToMarkup(latex, { defaultMode: "inline-math" });
    expect(
      compile({
        file: "/docs/calculus/grad.md",
        frontmatter,
        body: "*Note*\n",
      }),
    ).toEqual({
      id: "calculus/grad",
      tags: ["calculus"],
      keyboard: "grad(f)",
      expressionHtml: inline("\\operatorname{grad}(f)"),
      summaryHtml: `Total derivative of ${inline("f")}.`,
      detailsHtml: "<p><em>Note</em></p>\n",
    });
  });

  test("omits detailsHtml when the body is empty", () => {
    const doc = compile({
      file: "/docs/calculus/grad.md",
      frontmatter,
      body: "",
    });
    expect(doc).not.toHaveProperty("detailsHtml");
  });

  test.each([
    { case: "no front matter", data: undefined },
    { case: "an unknown key", data: { ...frontmatter, type: "function" } },
    { case: "a missing field", data: { ...frontmatter, keyboard: undefined } },
    { case: "an unknown tag", data: { ...frontmatter, tags: ["algebra"] } },
  ])("rejects $case", ({ data }) => {
    expect(() =>
      compile({ file: "/docs/calculus/grad.md", frontmatter: data, body: "" }),
    ).toThrow();
  });
});
