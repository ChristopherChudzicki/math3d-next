/**
 * This file is run at compile-time, not runtime.
 *
 * Handled via [vite-plugin-compile-time](https://github.com/egoist/vite-plugin-compile-time)
 */
import { load as loadYaml } from "js-yaml";
import { marked } from "marked";
import { convertLatexToMarkup } from "mathlive";
import * as yup from "yup";
import fs from "fs";
import path from "path";
import { Tag } from "./util";
import type { ReferenceEntry } from "./util";

const readAll = () => {
  const files = fs.readdirSync(path.join(__dirname, "docs"), {
    recursive: true,
  }) as string[];
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => path.join(__dirname, "docs", f))
    .map((filepath) => {
      return {
        filepath,
        contents: fs.readFileSync(filepath, "utf-8"),
      };
    });
};

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

const files = readAll();

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

const parseFrontMatter = (filepath: string, contents: string) => {
  const match = FRONT_MATTER.exec(contents);
  if (match === null) {
    throw new Error(`${filepath} must start with --- front matter`);
  }
  return {
    data: loadYaml(match[1]),
    content: contents.slice(match[0].length),
  };
};

const schema = yup.object({
  name: yup.string().required(),
  summary: yup
    .string()
    .required()
    .test((v) => {
      if (v.slice(0, -1).includes("\n")) {
        throw new Error("Summary cannot contain newlines");
      }
      return true;
    }),
  keyboard: yup.string().required(),
  latex: yup.string().required(),
  tags: yup
    .array()
    .of(yup.string().oneOf(Object.values(Tag)).required())
    .required(),
  type: yup.string().oneOf(["constant", "function"]).required(),
});

const validateMetadata = (filepath: string, data: unknown) => {
  try {
    return schema.validateSync(data);
  } catch (err) {
    throw new Error(`Error validating ${filepath}:\n${err}`);
  }
};

export const entries: ReferenceEntry[] = files.map(({ filepath, contents }) => {
  const { data, content } = parseFrontMatter(filepath, contents);
  const metadata = validateMetadata(filepath, data);
  const entry: ReferenceEntry = {
    ...metadata,
    detailsHtml: renderMarkdown(content),
    latex: convertLatexToMarkup(metadata.latex),
    summaryInnerHtml: renderMarkdown(metadata.summary, { inline: true }),
    id: filepath,
  };
  return entry;
});

export type { ReferenceEntry };
