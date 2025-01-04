import showdown from "showdown";
import matter from "gray-matter";
import { convertLatexToMarkup } from "mathlive";
import * as yup from "yup";
import fs from "fs";
import path from "path";

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

enum Tag {
  Trig = "trig",
  Algebra = "algebra",
  Calculus = "calculus",
  ExpLog = "explog",
  Misc = "misc",
}

interface BaseReferenceEntry {
  id: string;
  /**
   * Human-readable name, displayed to users
   */
  name: string;
  latex: string;
  keyboard: string;
  summary: string;
  details?: string;
  tags: string[];
}
interface ConstantEntry extends BaseReferenceEntry {
  type: "constant";
}
interface FunctionEntry extends BaseReferenceEntry {
  type: "function";
}
type ReferenceEntry = ConstantEntry | FunctionEntry;

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
  summary: yup.string().required(),
  keyboard: yup.string().required(),
  latex: yup.string().required(),
  tags: yup
    .array()
    .of(yup.string().oneOf(Object.values(Tag)).required())
    .required(),
  type: yup.string().oneOf(["constant", "function"]).required(),
});

const validateEntry = (filepath: string, data: unknown) => {
  try {
    return schema.validateSync(data);
  } catch (err) {
    throw new Error(`Error validating ${filepath}:\n${err}`);
  }
};

export const entries: ReferenceEntry[] = files.map(({ filepath, contents }) => {
  const { data, content } = matter(contents);
  const details = converter.makeHtml(content);
  const metadata = validateEntry(filepath, data);
  const entry: ReferenceEntry = {
    ...metadata,
    details,
    latex: convertLatexToMarkup(metadata.latex),
    summary: converter.makeHtml(metadata.summary),
    id: filepath,
  };
  return entry;
});

export type { ReferenceEntry };
