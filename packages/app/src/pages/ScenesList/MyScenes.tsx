/* eslint-disable no-nested-ternary */
import React, { useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import { useInfiniteScenesMe } from "@math3d/api";
import Link from "@/util/components/Link";
import LoadingSpinner from "@/util/components/LoadingSpinner/LoadingSpinner";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { debounce } from "lodash-es";
import { useAuthStatus } from "@/features/auth";
import styles from "./ScenesList.module.css";

const { format } = new Intl.DateTimeFormat(navigator.languages[0]);

const MyScenesList: React.FC = () => {
  const [isAuthenticated] = useAuthStatus();
  const [filterText, setFilterText] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const debouncedSetFilterValue = useMemo(
    () => debounce(setFilterValue, 300),
    [],
  );
  const { status, data, fetchNextPage, hasNextPage } = useInfiniteScenesMe(
    {
      limit: 50,
      title: filterValue,
    },
    {
      enabled: isAuthenticated,
    },
  );

  const handleFilterChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    setFilterText(e.target.value);
    debouncedSetFilterValue(e.target.value);
  };

  const allItems = data ? data.pages.flatMap((d) => d.results ?? []) : [];
  if (!isAuthenticated) {
    return (
      <p className={styles["with-margin"]}>
        To view scenes you have saved, <Link href="../auth/login">log in</Link>{" "}
        or <Link href="../auth/register">create an account</Link>.
      </p>
    );
  }
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
        value={filterText}
        className={styles["filter-input"]}
        onChange={handleFilterChange}
      />
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
          loader={<LoadingSpinner className={styles["with-margin"]} />}
          scrollableTarget="scrollableDiv"
        >
          {allItems.map((item) => (
            <ListItemButton
              LinkComponent={Link}
              key={item.key}
              href={`/${item.key}/scenes/me`}
            >
              <ListItemText
                primary={item.title}
                secondary={`Last modified: ${format(
                  new Date(item.modifiedDate),
                )}`}
              />
            </ListItemButton>
          ))}
        </InfiniteScroll>
      </List>
    </>
  );
};

export default MyScenesList;
