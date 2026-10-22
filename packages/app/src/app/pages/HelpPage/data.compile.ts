/**
 * This file is run at compile-time, not runtime.
 *
 * Handled via [vite-plugin-compile-time](https://github.com/egoist/vite-plugin-compile-time)
 */
import { load as loadYaml } from "js-yaml";
import { convertLatexToMarkup } from "mathlive";
import * as yup from "yup";
import fs from "fs";
import path from "path";
import { Tag } from "./util";
import { renderMarkdown } from "./renderMarkdown";
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
