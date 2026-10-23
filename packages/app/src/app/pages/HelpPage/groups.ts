/**
 * Help reference groups, in display order. A doc's first tag is its group.
 *
 * Imported by the build-time help-docs plugin to validate doc tags, so this
 * file has no imports.
 */
const HELP_GROUPS = [
  "algebra",
  "calculus",
  "constants",
  "explog",
  "misc",
  "trig",
  "trig-hyperbolic",
] as const;

type HelpGroup = (typeof HELP_GROUPS)[number];

const HELP_GROUP_LABELS: Record<HelpGroup, string> = {
  algebra: "Algebra",
  calculus: "Calculus",
  constants: "Constants",
  explog: "Logs & Exponents",
  misc: "Miscellaneous",
  trig: "Trigonometry",
  "trig-hyperbolic": "Trigonometry (Hyperbolic)",
};

export { HELP_GROUPS, HELP_GROUP_LABELS };
export type { HelpGroup };
