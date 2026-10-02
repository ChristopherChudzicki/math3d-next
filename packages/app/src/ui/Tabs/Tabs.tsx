import React from "react";
import classNames from "classnames";
import { Tabs as BaseTabs } from "@base-ui/react/tabs";
import * as styles from "./Tabs.module.css";

const { Root, Panel } = BaseTabs;

type RootProps = BaseTabs.Root.Props;

type ListProps = Omit<BaseTabs.List.Props, "className"> & {
  className?: string;
};

/**
 * Arrow keys move focus and Enter or Space activates (manual activation), so
 * an activation with side effects, such as a navigation, isn't triggered by
 * just moving through the tabs.
 */
const List: React.FC<ListProps> = ({ className, ...others }) => (
  <BaseTabs.List {...others} className={classNames(styles.list, className)} />
);

type TabProps = Omit<BaseTabs.Tab.Props, "className"> & {
  className?: string;
};

const Tab: React.FC<TabProps> = ({ className, ...others }) => (
  <BaseTabs.Tab {...others} className={classNames(styles.tab, className)} />
);

export { Root, List, Tab, Panel };
export type { RootProps, ListProps, TabProps };
