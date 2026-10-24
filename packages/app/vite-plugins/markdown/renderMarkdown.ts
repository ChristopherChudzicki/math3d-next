import { marked } from "marked";
import { convertLatexToMarkup } from "mathlive";

const MATH = [
  { regex: /\\\((.*?)\\\)/g, mode: "inline-math" },
  { regex: /\\\[([\s\S]*?)\\\]/g, mode: "math" },
] as const;
const PLACEHOLDER = /MATHPLACEHOLDER(\d+)X/g;

/**
 * Renders markdown whose \( \) and \[ \] spans are LaTeX. The math is swapped
 * for inert placeholders before markdown parsing, so markdown syntax inside
 * it (`_`, `*`, `\`) is never interpreted.
 */
const renderMarkdown = (markdown: string, { inline = false } = {}) => {
  const math: string[] = [];
  const masked = MATH.reduce(
    (text, { regex, mode }) =>
      text.replace(regex, (_match, latex: string) => {
        math.push(convertLatexToMarkup(latex, { defaultMode: mode }));
        return `MATHPLACEHOLDER${math.length - 1}X`;
      }),
    markdown,
  );
  const html = inline
    ? marked.parseInline(masked, { async: false })
    : marked.parse(masked, { async: false });
  return html.replace(PLACEHOLDER, (_match, i: string) => math[Number(i)]);
};

export { renderMarkdown };
