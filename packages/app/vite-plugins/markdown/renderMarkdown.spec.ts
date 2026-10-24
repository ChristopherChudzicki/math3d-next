import { convertLatexToMarkup } from "mathlive";
import { renderMarkdown } from "./renderMarkdown";

describe("renderMarkdown", () => {
  test("renders inline math without interpreting markdown inside it", () => {
    const math = convertLatexToMarkup("x_1 * y_2 *", {
      defaultMode: "inline-math",
    });
    expect(renderMarkdown("*a* \\(x_1 * y_2 *\\) _b_")).toBe(
      `<p><em>a</em> ${math} <em>b</em></p>\n`,
    );
  });

  test("renders display math spanning lines", () => {
    const math = convertLatexToMarkup("\nf_1 = x^*\n", { defaultMode: "math" });
    expect(renderMarkdown("Define\n\n\\[\nf_1 = x^*\n\\]")).toBe(
      `<p>Define</p>\n<p>${math}</p>\n`,
    );
  });

  test("inline: true omits the paragraph wrapper", () => {
    const math = convertLatexToMarkup("x", { defaultMode: "inline-math" });
    expect(renderMarkdown("Root of \\(x\\), **fast**", { inline: true })).toBe(
      `Root of ${math}, <strong>fast</strong>`,
    );
  });
});
