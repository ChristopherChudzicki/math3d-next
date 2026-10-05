import React, { useCallback } from "react";
import { Tabs } from "@/ui/Tabs";
import ScrollingYOverflowX from "@/ui/scrollingOverflow";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import styles from "./ControlTabs.module.css";
import { actions, MAIN_FOLDER, SETTINGS_FOLDER } from "../mathItems";

type Props = {
  loading: boolean;
  mainContent: React.ReactNode;
  setupContent: React.ReactNode;
  tabBarExtraContent: React.ReactNode;
};

const ControlTabs: React.FC<Props> = (props) => {
  const activeTab = useAppSelector((state) => state.scene.activeTabId);
  const dispatch = useDispatch();
  const handleChange = useCallback(
    (newValue: string) => {
      dispatch(actions.setActiveTab({ id: newValue }));
    },
    [dispatch],
  );
  return (
    <Tabs.Root value={activeTab} onValueChange={handleChange}>
      <div className={styles.tabsHeader}>
        <Tabs.List aria-label="Scene controls">
          <Tabs.Tab className={styles.tab} value={MAIN_FOLDER}>
            Main
          </Tabs.Tab>
          <Tabs.Tab className={styles.tab} value={SETTINGS_FOLDER}>
            Setup
          </Tabs.Tab>
        </Tabs.List>
        <div className={styles.tabListExtra}>{props.tabBarExtraContent}</div>
      </div>
      {/* Base UI makes panels tab stops; these start with controls. */}
      <Tabs.Panel
        aria-busy={props.loading && activeTab === MAIN_FOLDER}
        value={MAIN_FOLDER}
        tabIndex={-1}
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.mainContent}
        </ScrollingYOverflowX>
      </Tabs.Panel>
      <Tabs.Panel
        aria-busy={props.loading && activeTab === SETTINGS_FOLDER}
        value={SETTINGS_FOLDER}
        tabIndex={-1}
      >
        <ScrollingYOverflowX className={styles.scrollingOverflow}>
          {props.setupContent}
        </ScrollingYOverflowX>
      </Tabs.Panel>
    </Tabs.Root>
  );
};

export default ControlTabs;
