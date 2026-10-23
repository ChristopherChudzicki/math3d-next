import { convertLatexToMarkup } from "mathlive";
import { normalizePath } from "vite";
import path from "node:path";
import * as yup from "yup";
import type { HelpGroup } from "../../src/app/pages/HelpPage/groups";
import type { HelpDoc } from "../../src/app/pages/HelpPage/types";
import type { MarkdownSource } from "../markdown/plugin";
import { renderMarkdown } from "../markdown/renderMarkdown";

/**
 * Builds the `compile` function for Help docs: validates the front matter and
 * renders its fields to HTML.
 */
const compileHelpDoc = ({
  docsRoot,
  groups,
}: {
  docsRoot: string;
  groups: readonly HelpGroup[];
}) => {
  const schema = yup
    .object({
      name: yup.string().required(),
      latex: yup.string().required(),
      keyboard: yup.string().required(),
      summary: yup.string().required(),
      tags: yup
        .array()
        .of(yup.mixed<HelpGroup>().oneOf(groups).required())
        .min(1)
        .required(),
    })
    .noUnknown()
    .required();

  return ({ file, frontmatter, body }: MarkdownSource): HelpDoc => {
    // Without `strict`, yup ignores unknown keys instead of rejecting them.
    const meta = schema.validateSync(frontmatter, { strict: true });
    const detailsHtml = renderMarkdown(body);
    return {
      id: path.posix
        .relative(normalizePath(docsRoot), file)
        .replace(/\.md$/, ""),
      tags: meta.tags,
      keyboard: meta.keyboard,
      expressionHtml: convertLatexToMarkup(meta.latex, {
        defaultMode: "inline-math",
      }),
      summaryHtml: renderMarkdown(meta.summary, { inline: true }),
      ...(detailsHtml && { detailsHtml }),
    };
  };
};

export { compileHelpDoc };
