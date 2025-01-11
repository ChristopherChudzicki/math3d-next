/**
 * This file is run at compile-time, not runtime.
 *
 * Handled via [vite-plugin-compile-time](https://github.com/egoist/vite-plugin-compile-time)
 */
import showdown from "showdown";
import matter from "gray-matter";
import { convertLatexToMarkup } from "mathlive";
import * as yup from "yup";
import fs from "fs";
import path from "path";
import * as htmlparser2 from "htmlparser2";
import invariant from "tiny-invariant";
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

const mathExtensions: showdown.ShowdownExtension[] = [
  {
    type: "lang",
    regex: /\\\((.*?)\\\)/g,
    replace: (text: string) => {
      return convertLatexToMarkup(text, { defaultMode: "inline-math" });
    },
  },
  {
    type: "lang",
    regex: /\\\[((.|\n)*?)\\\]/g,
    replace: (text: string) => {
      return convertLatexToMarkup(text, { defaultMode: "math" });
    },
  },
];

const files = readAll();

const converter = new showdown.Converter({
  extensions: [...mathExtensions],
});

const schema = yup.object({
  name: yup.string().required(),
  summary: yup
    .string()
    .required()
    .test((v) => {
      if (v.includes("\n")) {
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
const summaryInnerHtml = (summary: string) => {
  const html = converter.makeHtml(summary);
  const dom = htmlparser2.parseDocument(html);
  if (dom.childNodes.length !== 1) {
    throw new Error("Summary must have exactly one root element");
  }
  const regex = /<p>(.*?)<\/p>/;
  const match = regex.exec(html);
  invariant(match !== null, "Summary must be a paragraph");
  const innerHtml = match[1];
  return innerHtml;
};

export const entries: ReferenceEntry[] = files.map(({ filepath, contents }) => {
  const { data, content } = matter(contents);
  const metadata = validateMetadata(filepath, data);
  const entry: ReferenceEntry = {
    ...metadata,
    detailsHtml: converter.makeHtml(content),
    latex: convertLatexToMarkup(metadata.latex),
    summaryInnerHtml: summaryInnerHtml(metadata.summary),
    id: filepath,
  };
  return entry;
});

export type { ReferenceEntry };
