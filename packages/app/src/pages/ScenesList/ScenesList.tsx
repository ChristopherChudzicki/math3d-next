import React, { useCallback, useId, useState } from "react";
import Drawer from "@mui/material/Drawer";

import { useNavigate } from "react-router-dom";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import ExamplesListing from "./ExamplesListing";

type TabName = "examples" | "my-scenes";
type ScenesListProps = {
  initialTab: TabName;
};

const ScenesList: React.FC<ScenesListProps> = ({ initialTab }) => {
  const [tab, setTab] = useState(initialTab);
  const navigate = useNavigate();
  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: TabName) => {
    setTab(newValue);
  };

  const examplesId = useId();

  return (
    <Drawer open anchor="right" onClose={handleClose}>
      <TabContext value={tab}>
        <Box
          sx={{ minWidth: "300px", borderBottom: 1, borderColor: "divider" }}
        >
          <TabList onChange={handleChangeTab} aria-label="lab API tabs example">
            <Tab label="Examples" id={examplesId} value="examples" />
            <Tab label="My Scenes" value="my-scenes" />
          </TabList>
        </Box>
        <TabPanel value="examples" sx={{ padding: "0px" }}>
          <ExamplesListing aria-labelledby={examplesId} />
        </TabPanel>
        <TabPanel value="my-scenes">Item Two</TabPanel>
      </TabContext>
    </Drawer>
  );
};

export default ScenesList;
