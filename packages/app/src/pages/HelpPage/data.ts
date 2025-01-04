import showdown from "showdown";
import { convertLatexToMarkup } from "mathlive";
import * as yup from "yup";

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

const mathExtension: showdown.ShowdownExtension = {
  type: "lang",
  regex: /\\\((.*?)\\\)/g,
  replace: (text: string) => {
    return convertLatexToMarkup(text);
  },
};

const files = import.meta.glob("./docs/**/*.md", {
  eager: true,
  query: "?raw",
}) as Record<string, { default: string }>;

const converter = new showdown.Converter({
  extensions: [mathExtension],
  metadata: true,
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
const validateEntry = (path: string, data: object) => {
  try {
    // @ts-expect-error this is untyped
    const tags = data.tags.split(",");
    return schema.validateSync({ ...data, tags });
  } catch (err) {
    throw new Error(`Error validating ${path}:\n${err}`);
  }
};

const entries: ReferenceEntry[] = Object.entries(files).map(([path, file]) => {
  const details = converter.makeHtml(file.default);
  const metadata = validateEntry(path, converter.getMetadata());
  const entry: ReferenceEntry = {
    ...metadata,
    details,
    id: path,
  };
  return entry;
});

window.files = files;
window.entries = entries;

export { files };
