interface ReferenceEntry {
  id: string;
  /**
   * Human-readable name, displayed to users
   */
  name: string;
  latex: string;
  keyboard: string;
  summaryInnerHtml: string;
  detailsHtml?: string;
  tags: string[];
}

enum Tag {
  Trig = "trig",
  TrigHyperbolic = "trig-hyperbolic",
  Algebra = "algebra",
  Calculus = "calculus",
  ExpLog = "explog",
  Misc = "misc",
  Constants = "constants",
}

const READABLE_TAG: Record<Tag, string> = {
  [Tag.Algebra]: "Algebra",
  [Tag.Calculus]: "Calculus",
  [Tag.Trig]: "Trigonometry",
  [Tag.TrigHyperbolic]: "Trigonometry (Hyperbolic)",
  [Tag.Misc]: "Miscellaneous",
  [Tag.ExpLog]: "Logs & Exponents",
  [Tag.Constants]: "Constants",
};

type EntryGroup = {
  tag: Tag;
  label: string;
  entries: ReferenceEntry[];
};

const groupEntries = (entries: ReferenceEntry[]): EntryGroup[] => {
  const groupMap = Object.groupBy(entries, (entry) => {
    return entry.tags[0] as Tag;
  });
  const groups = Object.entries(groupMap)
    .map(([t, group]) => {
      const tag = t as Tag;
      return {
        tag,
        label: READABLE_TAG[tag],
        entries: group,
      };
    })
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });
  return groups;
};

export { Tag, READABLE_TAG, groupEntries };
export type { ReferenceEntry };
