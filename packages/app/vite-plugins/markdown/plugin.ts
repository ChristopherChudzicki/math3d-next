import type { Plugin } from "vite";
import { parseFrontMatter } from "./parseFrontMatter";
import { renderMarkdown } from "./renderMarkdown";

type MarkdownSource = {
  /** Absolute path of the `.md` file. */
  file: string;
  frontmatter: unknown;
  body: string;
};

type MarkdownOptions = {
  /** Handles `*.md?<query>` imports; other markdown imports are untouched. */
  query: string;
  /** Builds the module's default export, which must be JSON-serializable. */
  compile?: (source: MarkdownSource) => unknown;
};

const renderBody = ({ frontmatter, body }: MarkdownSource) => ({
  frontmatter,
  html: renderMarkdown(body),
});

/**
 * Compiles markdown imports at build time, so the markdown and math
 * libraries never reach the browser bundle.
 */
const markdown = ({ query, compile = renderBody }: MarkdownOptions): Plugin => {
  const suffix = `.md?${query}`;
  return {
    name: `math3d:markdown?${query}`,
    // Vite's default loader strips the query and reads the file, so `source`
    // is the raw markdown and the module's file is the .md (HMR included).
    transform(source, id) {
      if (!id.endsWith(suffix)) return null;
      const file = id.slice(0, -`?${query}`.length);
      const value = compile({ file, ...parseFrontMatter(source) });
      return { code: `export default ${JSON.stringify(value)};`, map: null };
    },
  };
};

export { markdown };
export type { MarkdownSource };
