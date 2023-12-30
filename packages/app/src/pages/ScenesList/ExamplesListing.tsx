import React from "react";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { SxProps, Theme } from "@mui/material";
import { useNavigate } from "react-router";
import examplesData from "./examples_data.json";

const listStyles: SxProps<Theme> = {
  bgcolor: "background.paper",
  width: "300px",
};

type ExamplesListingProps = {
  "aria-labelledby": string;
};

const ExamplesListing: React.FC<ExamplesListingProps> = ({
  "aria-labelledby": ariaLabelledBy,
}) => {
  const navigate = useNavigate();
  return (
    <List
      sx={listStyles}
      component="nav"
      dense
      aria-labelledby={ariaLabelledBy}
    >
      {examplesData.map((e) => (
        <ListItemButton key={e.id} onClick={() => navigate(`/${e.id}`)}>
          <ListItemText primary={e.text.primary} secondary={e.text.secondary} />
        </ListItemButton>
      ))}
    </List>
  );
};

export default ExamplesListing;
