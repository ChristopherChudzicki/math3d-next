import React, { useId } from "react";
import Drawer from "@mui/material/Drawer";
import type { DrawerProps } from "@mui/material/Drawer";
import { SxProps, Theme } from "@mui/material";
import ListSubheader from "@mui/material/ListSubheader";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useNavigate } from "react-router-dom";
import styles from "./ExamplesDrawer.module.css";

import examplesData from "./examples_data.json";

type ExamplesDrawerProps = {
  open: boolean;
  onClose?: DrawerProps["onClose"];
};

const listStyles: SxProps<Theme> = {
  width: "200px",
  bgcolor: "background.paper",
};
const ExamplesDrawer: React.FC<ExamplesDrawerProps> = ({ open, onClose }) => {
  const examplesListId = useId();
  const navigate = useNavigate();

  return (
    <Drawer open={open} anchor="right" onClose={onClose}>
      <List
        className={styles.examplesList}
        sx={listStyles}
        component="nav"
        dense
        aria-labelledby={examplesListId}
        subheader={
          <ListSubheader component="h3" id={examplesListId}>
            Examples
          </ListSubheader>
        }
      >
        {examplesData.map((e) => (
          <ListItemButton key={e.id} onClick={() => navigate(`/${e.id}`)}>
            <ListItemText
              primary={e.text.primary}
              secondary={e.text.secondary}
            />
          </ListItemButton>
        ))}
      </List>
    </Drawer>
  );
};

export default ExamplesDrawer;
