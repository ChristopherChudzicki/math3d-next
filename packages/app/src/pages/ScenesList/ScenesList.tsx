import React, { useCallback, useEffect, useId, useState } from "react";
import Drawer from "@mui/material/Drawer";

import { useNavigate, useParams } from "react-router-dom";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import invariant from "tiny-invariant";
import ExamplesListing from "./ExamplesListing";
import MyScenes from "./MyScenes";
import styles from "./ScenesList.module.css";

enum ListType {
  Examples = "examples",
  Me = "me",
}

const ScenesList: React.FC = () => {
  const { listType } = useParams<{ listType: ListType }>();
  const navigate = useNavigate();
  invariant(listType);
  const activateListType = useCallback(
    (aListType: ListType) => {
      navigate(`../scenes/${aListType}`);
    },
    [navigate],
  );
  useEffect(() => {
    if (!Object.values(ListType).includes(listType)) {
      activateListType(ListType.Examples);
    }
  }, [activateListType, listType]);

  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);

  const handleChangeTab = (_e: React.SyntheticEvent, newValue: ListType) => {
    activateListType(newValue);
  };

  const examplesId = useId();
  const myScenesId = useId();

  return (
    <Drawer open anchor="right" onClose={handleClose}>
      <TabContext value={listType}>
        <Box
          sx={{ minWidth: "300px", borderBottom: 1, borderColor: "divider" }}
        >
          <TabList
            className={styles.tabList}
            onChange={handleChangeTab}
            aria-label="lab API tabs example"
          >
            <Tab label="Examples" id={examplesId} value={ListType.Examples} />
            <Tab label="My Scenes" value={ListType.Me} />
          </TabList>
        </Box>
        <TabPanel value={ListType.Examples} className={styles.tabPanel}>
          <ExamplesListing aria-labelledby={examplesId} />
        </TabPanel>
        <TabPanel value={ListType.Me} className={styles.tabPanel}>
          <MyScenes aria-labelledby={myScenesId} />
        </TabPanel>
      </TabContext>
    </Drawer>
  );
};

export default ScenesList;
