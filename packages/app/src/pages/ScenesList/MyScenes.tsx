/* eslint-disable no-nested-ternary */
import React, { useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useInfiniteScenesMe } from "@math3d/api";
import Link from "@/util/components/Link";
import LoadingSpinner from "@/util/components/LoadingSpinner/LoadingSpinner";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import styles from "./ScenesList.module.css";

type MyScenesListProps = {
  "aria-labelledby": string;
};

const MyScenesList: React.FC<MyScenesListProps> = (props) => {
  const [filter, setFilter] = useState("");
  const { status, data, fetchNextPage, hasNextPage } = useInfiniteScenesMe({
    limit: 50,
    title: filter,
  });

  const handleFilterChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    setFilter(e.target.value);
  };

  const allItems = data ? data.pages.flatMap((d) => d.results ?? []) : [];
  if (status === "pending") {
    return <LoadingSpinner className={styles["with-margin"]} />;
  }
  if (status === "error") {
    return (
      <Alert className={styles["with-margin"]} severity="error">
        Error loading scenes.
      </Alert>
    );
  }
  return (
    <>
      <TextField
        label="Filter scenes"
        size="small"
        value={filter}
        className={styles["filter-input"]}
        onChange={handleFilterChange}
      />
      <List
        component="nav"
        aria-labelledby={props["aria-labelledby"]}
        dense
        id="scrollableDiv"
        className={styles.infiniteList}
      >
        <InfiniteScroll
          dataLength={allItems.length}
          hasMore={hasNextPage}
          next={fetchNextPage}
          loader={<LoadingSpinner className={styles["with-margin"]} />}
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
    </>
  );
};

export default MyScenesList;
