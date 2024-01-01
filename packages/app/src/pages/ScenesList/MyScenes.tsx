/* eslint-disable no-nested-ternary */
import React from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useInfiniteScenesMe } from "@math3d/api";
import Link from "@/util/components/Link";
import styles from "./ScenesList.module.css";

const VirtualizerDynamic: React.FC = () => {
  const {
    // status,
    data,
    // error,
    // isFetching,
    // isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteScenesMe({ limit: 50 });

  const allItems = data ? data.pages.flatMap((d) => d.results ?? []) : [];
  return (
    <List
      component="nav"
      dense
      id="scrollableDiv"
      className={styles.infiniteList}
    >
      <InfiniteScroll
        dataLength={allItems.length}
        hasMore={hasNextPage}
        next={fetchNextPage}
        loader={<h4>Loading...</h4>}
        scrollableTarget="scrollableDiv"
      >
        {allItems.map((item) => (
          <ListItemButton
            LinkComponent={Link}
            key={item.key}
            href={`/${item.key}/scenes/me`}
          >
            <ListItemText primary={item.title} secondary="Date here" />
          </ListItemButton>
        ))}
      </InfiniteScroll>
    </List>
  );
};

export default VirtualizerDynamic;
