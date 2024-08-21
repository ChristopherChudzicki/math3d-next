import React, { useCallback } from "react";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import ScrollingYOverflowX from "@/util/components/scrollingOverflow";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import styles from "./ControlTabs.module.css";
import { actions, MAIN_FOLDER, SETTINGS_FOLDER } from "../mathItems";

type Props = {
  loading: boolean;
  mainNav: React.ReactNode;
  axesNav: React.ReactNode;
  mainContent: React.ReactNode;
  axesdContent: React.ReactNode;
  tabBarExtraContent: React.ReactNode;
};

const noPadding = { padding: 0 };

const SceneControls: React.FC<Props> = (props) => {
  const activeTab = useAppSelector((state) => state.scene.activeTabId);
  const dispatch = useDispatch();
  const handleChange = useCallback(
    (
      _event: React.SyntheticEvent,
      newValue: typeof MAIN_FOLDER | typeof SETTINGS_FOLDER,
    ) => {
      dispatch(
        actions.setActiveTab({
          id: newValue,
        }),
      );
    },
    [dispatch],
  );
  return (
    <TabContext value={activeTab}>
      <div className={styles.tabsHeader}>
        <TabList onChange={handleChange} aria-label="lab API tabs example">
          <Tab
            className={styles.tab}
            label={props.mainNav}
            value={MAIN_FOLDER}
          />
          <Tab
            className={styles.tab}
            label={props.axesNav}
            value={SETTINGS_FOLDER}
          />
        </TabList>
        <div className={styles.tabListExtra}>{props.tabBarExtraContent}</div>
      </div>
      <TabPanel
        aria-busy={props.loading && activeTab === MAIN_FOLDER}
        sx={noPadding}
        value={MAIN_FOLDER}
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.mainContent}
        </ScrollingYOverflowX>
      </TabPanel>
      <TabPanel
        aria-busy={props.loading && activeTab === "setup"}
        sx={noPadding}
        value={SETTINGS_FOLDER}
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.axesdContent}
        </ScrollingYOverflowX>
      </TabPanel>
    </TabContext>
  );
};

export default SceneControls;
