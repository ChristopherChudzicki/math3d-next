import type { HelpDoc } from "./types";

// Compiled by the `markdown({ query: "help-doc" })` plugin in vite.config.ts.
const modules = import.meta.glob<HelpDoc>("./docs/**/*.md", {
  query: "?help-doc",
  import: "default",
  eager: true,
});

const docs: HelpDoc[] = Object.values(modules).sort((a, b) =>
  a.id.localeCompare(b.id),
);

export { docs };
