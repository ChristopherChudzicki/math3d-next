import React, { useCallback, useEffect } from "react";
import Drawer from "@mui/material/Drawer";

import { useNavigate, useParams } from "react-router";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Box from "@mui/material/Box";
import invariant from "tiny-invariant";
import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import ExamplesListing from "./ExamplesListing";
import MyScenes from "./MyScenes";
import styles from "./ScenesList.module.css";

enum ListType {
  Examples = "examples",
  Me = "me",
}
const normalizeListType = (
  listType: string,
  showMyScenes: boolean,
): ListType => {
  if (!showMyScenes && listType === ListType.Me) {
    return ListType.Examples;
  }
  if (Object.values(ListType).includes(listType as ListType)) {
    return listType as ListType;
  }
  return ListType.Examples;
};

const ScenesList: React.FC = () => {
  const params = useParams<{ listType: ListType }>();
  invariant(params.listType);
  const [isAuthenticated] = useAuthStatus();
  const showMyScenes = DISPLAY_AUTH_FLOWS || isAuthenticated;
  const listType = normalizeListType(params.listType, showMyScenes);
  const navigate = useNavigate();
  const activateListType = useCallback(
    (aListType: ListType) => {
      navigate(`../scenes/${aListType}`);
    },
    [navigate],
  );
  useEffect(() => {
    if (listType !== params.listType) {
      activateListType(listType);
    }
  }, [activateListType, params.listType, listType]);

  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);

  const handleChangeTab = (_e: React.SyntheticEvent, newValue: ListType) => {
    activateListType(newValue);
  };

  return (
    <Drawer open anchor="right" onClose={handleClose}>
      <TabContext value={listType}>
        <Box
          sx={{ minWidth: "300px", borderBottom: 1, borderColor: "divider" }}
        >
          <TabList
            className={styles.tabList}
            onChange={handleChangeTab}
            aria-label="Scenes"
          >
            <Tab label="Examples" value={ListType.Examples} />
            {showMyScenes && <Tab label="My Scenes" value={ListType.Me} />}
          </TabList>
        </Box>
        <TabPanel value={ListType.Examples} className={styles.tabPanel}>
          <ExamplesListing />
        </TabPanel>
        <TabPanel value={ListType.Me} className={styles.tabPanel}>
          <MyScenes />
        </TabPanel>
      </TabContext>
    </Drawer>
  );
};

export default ScenesList;
