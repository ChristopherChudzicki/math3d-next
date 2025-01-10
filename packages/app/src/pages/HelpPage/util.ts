enum Tag {
  Trig = "trig",
  Algebra = "algebra",
  Calculus = "calculus",
  ExpLog = "explog",
  Misc = "misc",
}

const READABLE_TAG: Record<Tag, string> = {
  [Tag.Algebra]: "Algebra",
  [Tag.Calculus]: "Calculus",
  [Tag.Trig]: "Trigonometry",
  [Tag.Misc]: "Miscellaneous",
  [Tag.ExpLog]: "Logs & Exponents",
};

export { Tag, READABLE_TAG };
