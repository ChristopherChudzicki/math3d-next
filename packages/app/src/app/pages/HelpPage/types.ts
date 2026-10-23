import type { HelpGroup } from "./groups";

/** One Help reference entry, compiled from a markdown file in `docs/`. */
type HelpDoc = {
  /** Path under `docs/` without the extension, e.g. "trig/sin". */
  id: string;
  tags: HelpGroup[];
  keyboard: string;
  expressionHtml: string;
  summaryHtml: string;
  detailsHtml?: string;
};

export type { HelpDoc };
