import { HELP_GROUPS, HELP_GROUP_LABELS } from "./groups";
import type { HelpGroup } from "./groups";
import type { HelpDoc } from "./types";

type DocGroup = {
  id: HelpGroup;
  label: string;
  docs: HelpDoc[];
};

/** Groups docs by their first tag, in `HELP_GROUPS` order, skipping empty groups. */
const groupDocs = (docs: HelpDoc[]): DocGroup[] =>
  HELP_GROUPS.map((id) => ({
    id,
    label: HELP_GROUP_LABELS[id],
    docs: docs.filter((doc) => doc.tags[0] === id),
  })).filter((docGroup) => docGroup.docs.length > 0);

export { groupDocs };
