import React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Link from "@/util/components/Link";
import examplesData from "./examples_data.json";

type ExamplesListingProps = {
  "aria-labelledby": string;
};

const ExamplesListing: React.FC<ExamplesListingProps> = ({
  "aria-labelledby": ariaLabelledBy,
}) => {
  return (
    <List component="nav" dense aria-labelledby={ariaLabelledBy}>
      {examplesData.map((e) => (
        <ListItemButton
          key={e.id}
          LinkComponent={Link}
          href={`/${e.id}/scenes/examples`}
        >
          <ListItemText primary={e.text.primary} secondary={e.text.secondary} />
        </ListItemButton>
      ))}
    </List>
  );
};

export default ExamplesListing;
