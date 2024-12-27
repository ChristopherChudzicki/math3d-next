/* eslint-disable no-nested-ternary */
import React, { useCallback, useMemo, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItem from "@mui/material/ListItem";
import {
  MiniScene,
  useDestroyScene,
  useInfiniteScenesMe,
  usePatchScene,
} from "@math3d/api";
import Link from "@/util/components/Link";
import LoadingSpinner from "@/util/components/LoadingSpinner/LoadingSpinner";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import { debounce } from "lodash-es";
import { useAuthStatus } from "@/features/auth";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { useToggle } from "@/util/hooks";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import SimpleMenu, {
  SimpleMenuItem,
} from "@/util/components/SimpleMenu/SimpleMenu";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useNavigate, useParams } from "react-router";
import invariant from "tiny-invariant";
import { useNotifications } from "@/features/notifications/NotificationsContext";
import styles from "./ScenesList.module.css";

const { format } = new Intl.DateTimeFormat(navigator.languages[0]);

const MyScenesList: React.FC = () => {
  const [isAuthenticated] = useAuthStatus();
  const { sceneKey } = useParams();
  const navigate = useNavigate();
  const { add: addNotification } = useNotifications();
  const [filterText, setFilterText] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const patch = usePatchScene();
  const destroy = useDestroyScene();
  const patchMutate = patch.mutate;
  const archiveScene = useCallback(
    (scene: MiniScene) => {
      invariant(scene.key, "Scene key must be defined");
      patchMutate({
        key: scene.key,
        patch: {
          archived: !scene.archived,
        },
      });
    },
    [patchMutate],
  );
  const destroyMutateAsync = destroy.mutateAsync;
  const destroyScene = useCallback(
    async (scene: MiniScene) => {
      invariant(scene.key);
      const { confirmed } = addNotification({
        type: "confirmation",
        body: (
          <>
            Are you sure you want to delete the scene{" "}
            <strong>{scene.title}</strong>?
          </>
        ),
        title: "Delete scene?",
      });
      if (await confirmed) {
        await destroyMutateAsync(scene.key);
        if (scene.key === sceneKey) {
          navigate("/scenes/me");
        }
      }
    },
    [destroyMutateAsync, navigate, sceneKey, addNotification],
  );
  const [includeArchived, toggleIncludeArchived] = useToggle(false);
  const debouncedSetFilterValue = useMemo(
    () => debounce(setFilterValue, 300),
    [],
  );
  const { status, data, fetchNextPage, hasNextPage } = useInfiniteScenesMe(
    {
      limit: 50,
      title: filterValue,
      archived: includeArchived ? undefined : false,
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
        margin="normal"
        label="Filter scenes"
        size="small"
        value={filterText}
        className={styles["form-row"]}
        onChange={handleFilterChange}
      />
      <FormGroup className={styles["form-row"]}>
        <FormControlLabel
          control={
            <Checkbox
              checked={includeArchived}
              onChange={toggleIncludeArchived.toggle}
            />
          }
          label="Include archived"
        />
      </FormGroup>
      <List
        component="nav"
        dense
        id="scrollableDiv"
        className={styles.infiniteList}
      >
        {/* @ts-expect-error  InfiniteScroll TS bug */}
        <InfiniteScroll
          dataLength={allItems.length}
          hasMore={hasNextPage}
          next={fetchNextPage}
          loader={<LoadingSpinner className={styles["with-margin"]} />}
          scrollableTarget="scrollableDiv"
        >
          {allItems.map((item) => {
            const menuItems: SimpleMenuItem[] = [
              {
                key: "archive",
                label: item.archived ? "Unarchive" : "Archive",
                onClick: () => archiveScene(item),
              },
              {
                key: "delete",
                label: "Delete",
                onClick: () => destroyScene(item),
              },
            ];
            return (
              <ListItem
                disablePadding
                key={item.key}
                secondaryAction={
                  <SimpleMenu
                    items={menuItems}
                    trigger={
                      <IconButton size="small" aria-label="Edit">
                        <MoreVertIcon />
                      </IconButton>
                    }
                  />
                }
              >
                <ListItemButton
                  LinkComponent={Link}
                  href={`/${item.key}/scenes/me`}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between">
                        {item.title}
                        {item.archived ? (
                          <Chip color="warning" size="small" label="Archived" />
                        ) : null}
                      </Stack>
                    }
                    secondary={`Last modified: ${format(
                      new Date(item.modifiedDate),
                    )}`}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </InfiniteScroll>
      </List>
    </>
  );
};

export default MyScenesList;
