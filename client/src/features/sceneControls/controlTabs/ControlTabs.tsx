import { Tabs } from "antd";
import React from "react";
import ScrollingYOverflowX from "@/util/components/scrollingOverflow";

const { TabPane } = Tabs;

type Props = {
  loading: boolean;
  mainNav: React.ReactNode;
  axesNav: React.ReactNode;
  mainContent: React.ReactNode;
  axesdContent: React.ReactNode;
  tabBarExtraContent: React.ReactNode;
};

const TABS_NAV_HEIGHT = "60px";
const tabsStyle = {
  height: TABS_NAV_HEIGHT,
  paddingLeft: "1em",
  paddingRight: "1em",
  marginBottom: "0px",
} as React.CSSProperties;
const scrollingOverflowStyle = {
  height: `calc(100vh - ${TABS_NAV_HEIGHT} - var(--header-height))`,
} as React.CSSProperties;

const SceneControls: React.FC<Props> = (props) => (
  <Tabs
    aria-busy={props.loading}
    tabBarExtraContent={props.tabBarExtraContent}
    tabBarStyle={tabsStyle}
  >
    <TabPane tab={props.mainNav} key="main">
      <ScrollingYOverflowX style={scrollingOverflowStyle}>
        {props.mainContent}
      </ScrollingYOverflowX>
    </TabPane>
    <TabPane tab={props.axesNav} key="axes">
      <ScrollingYOverflowX style={scrollingOverflowStyle}>
        {props.axesdContent}
      </ScrollingYOverflowX>
    </TabPane>
  </Tabs>
);

export default SceneControls;
