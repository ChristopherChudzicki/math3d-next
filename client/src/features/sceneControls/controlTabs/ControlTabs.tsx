import React, { useState, useCallback } from "react";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import ScrollingYOverflowX from "@/util/components/scrollingOverflow";
import styles from "./ControlTabs.module.css";

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
  const [tab, setTab] = useState("main");
  const handleChange = useCallback(
    (_event: React.SyntheticEvent, newValue: string) => {
      setTab(newValue);
    },
    []
  );
  return (
    <TabContext value={tab}>
      <div className={styles.tabsHeader}>
        <TabList onChange={handleChange} aria-label="lab API tabs example">
          <Tab label={props.mainNav} value="main" />
          <Tab label={props.axesNav} value="axes" />
        </TabList>
        <div className={styles.tabListExtra}>{props.tabBarExtraContent}</div>
      </div>
      <TabPanel
        aria-busy={props.loading && tab === "main"}
        sx={noPadding}
        value="main"
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.mainContent}
        </ScrollingYOverflowX>
      </TabPanel>
      <TabPanel
        aria-busy={props.loading && tab === "axes"}
        sx={noPadding}
        value="axes"
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.axesdContent}
        </ScrollingYOverflowX>
      </TabPanel>
    </TabContext>
  );
};

export default SceneControls;
