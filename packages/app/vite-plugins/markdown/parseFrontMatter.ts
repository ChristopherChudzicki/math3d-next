import { load as loadYaml } from "js-yaml";

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;

/**
 * Splits a leading `---` YAML block from the markdown body. `frontmatter` is
 * undefined when the file has no such block.
 */
const parseFrontMatter = (
  source: string,
): { frontmatter: unknown; body: string } => {
  const match = FRONT_MATTER.exec(source);
  if (match === null) return { frontmatter: undefined, body: source };
  return {
    frontmatter: loadYaml(match[1]),
    body: source.slice(match[0].length),
  };
};

export { parseFrontMatter };
