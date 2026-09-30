import React, { useEffect, useMemo, useRef, useState } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  MiniScene,
  useDestroyScene,
  useInfiniteScenesMe,
  usePatchScene,
} from "@math3d/api";
import { debounce } from "lodash-es";
import { useNavigate, useParams } from "react-router";
import { Icon } from "@iconify/react/offline";
import moreVertical from "@iconify-icons/lucide/more-vertical";
import archiveIcon from "@iconify-icons/lucide/archive";
import archiveRestore from "@iconify-icons/lucide/archive-restore";
import trash2 from "@iconify-icons/lucide/trash-2";
import Button from "@/ui/Button";
import Checkbox from "@/ui/Checkbox";
import { Drawer } from "@/ui/Drawer";
import IconButton from "@/ui/IconButton";
import LoadingSpinner from "@/ui/LoadingSpinner/LoadingSpinner";
import { Menu } from "@/ui/Menu";
import TextField from "@/ui/TextField";
import { u } from "@/util/styles";
import { useAuthStatus } from "@/features/auth";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import DeleteSceneDialog from "./DeleteSceneDialog";
import SceneCard from "./SceneCard/SceneCard";
import { ListType, sceneHref } from "./constants";
import styles from "./ScenesList.module.css";

const SCROLL_ID = "my-scenes-scroll";

const titleOf = (scene: MiniScene) => scene.title || "Untitled";

const countMessage = (count: number) => {
  if (count === 0) return "No scenes";
  return count === 1 ? "1 scene" : `${count} scenes`;
};

/*
 * Cards are found in the DOM when focus moves, not tracked with refs: Link and
 * Button merge refs into a new callback each render, so a ref map is briefly
 * empty during the very commit in which a closing dialog restores focus.
 */
const cardLink = (key: string) =>
  document
    .getElementById(SCROLL_ID)
    ?.querySelector<HTMLAnchorElement>(
      `a[href="${sceneHref(key, ListType.Me)}"]`,
    ) ?? null;
const cardMenuButton = (key: string) =>
  cardLink(key)?.closest("li")?.querySelector("button") ?? null;

const MyScenesList: React.FC = () => {
  const { sceneKey } = useParams();
  const navigate = useNavigate();
  const [filterText, setFilterText] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  // Keyed per message, so a repeated message is still announced.
  const [status, setStatus] = useState({ text: "", id: 0 });
  const announce = (text: string) =>
    setStatus((prev) => ({ text, id: prev.id + 1 }));
  const [deleteTarget, setDeleteTarget] = useState<MiniScene | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const patch = usePatchScene();
  const destroy = useDestroyScene();

  const filterRef = useRef<HTMLInputElement>(null);
  // Where the delete dialog returns focus: a neighbor's card after a delete
  // (null: the filter field), else the scene's own menu button.
  const deleteFocus = useRef<{ deleted: boolean; key: string | null }>({
    deleted: false,
    key: null,
  });
  const announceCount = useRef(false);

  const debouncedSetFilterValue = useMemo(
    () =>
      debounce((value: string) => {
        setFilterValue((prev) => {
          if (prev !== value) announceCount.current = true;
          return value;
        });
      }, 300),
    [],
  );
  const query = useInfiniteScenesMe({
    limit: 50,
    title: filterValue,
    archived: includeArchived ? undefined : false,
  });
  const items = useMemo(
    () => query.data?.pages.flatMap((page) => page.items) ?? [],
    [query.data],
  );
  const settled = query.isSuccess && !query.isPlaceholderData;

  useEffect(() => {
    if (!announceCount.current) return;
    if (query.isError) announceCount.current = false;
    if (settled) {
      announceCount.current = false;
      announce(countMessage(query.data.pages[0]?.count ?? 0));
    }
  }, [settled, query.isError, query.data]);
  useEffect(() => {
    if (query.isFetchingNextPage) announce("Loading more scenes…");
  }, [query.isFetchingNextPage]);

  const handleFilterChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    setFilterText(e.target.value);
    debouncedSetFilterValue(e.target.value);
  };
  const handleIncludeArchived = (checked: boolean) => {
    setIncludeArchived(checked);
    announceCount.current = true;
  };

  /** The card that takes focus when `key`'s card goes away: next, else previous. */
  const neighborKey = (key: string): string | null => {
    const i = items.findIndex((item) => item.key === key);
    return (items[i + 1] ?? items[i - 1])?.key ?? null;
  };
  const elementFor = (key: string | null) =>
    (key && cardLink(key)) || filterRef.current;

  const toggleArchived = async (scene: MiniScene) => {
    const archiving = !scene.archived;
    const disappears = archiving && !includeArchived;
    const focusKey = neighborKey(scene.key);
    try {
      // Resolves after the list refetches, so a removed card is gone by then.
      await patch.mutateAsync({
        key: scene.key,
        patch: { archived: archiving },
      });
      announce(`${archiving ? "Archived" : "Unarchived"} ${titleOf(scene)}`);
      if (disappears) elementFor(focusKey)?.focus();
    } catch {
      announce(
        `Couldn't ${archiving ? "archive" : "unarchive"} ${titleOf(scene)}`,
      );
    }
  };

  const chooseDelete = (scene: MiniScene) => {
    deleteFocus.current = { deleted: false, key: scene.key };
    setDeleteTarget(scene);
    setDeleteFailed(false);
    setDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const scene = deleteTarget;
    const focusKey = neighborKey(scene.key);
    setDeleteFailed(false);
    try {
      await destroy.mutateAsync(scene.key);
    } catch {
      setDeleteFailed(true);
      return;
    }
    deleteFocus.current = { deleted: true, key: focusKey };
    setDeleteOpen(false);
    announce(`Deleted ${titleOf(scene)}`);
    if (scene.key === sceneKey) {
      // The deleted scene's URL must not stay the current entry. (If the
      // dialog was opened by a push, the entry below still holds it.)
      navigate("/?overlay=scenes&list=me", { replace: true });
    }
  };
  const deleteDialogFinalFocus = () => {
    const { deleted, key } = deleteFocus.current;
    if (deleted) return elementFor(key);
    return key ? cardMenuButton(key) : null;
  };

  const renderBody = () => {
    if (query.isPending) {
      return <LoadingSpinner label="Loading scenes" />;
    }
    if (query.isError && !query.data) {
      return (
        <div className={styles.message}>
          <p className={styles.hint}>Couldn&rsquo;t load scenes.</p>
          <Button size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      );
    }
    if (items.length === 0 && settled) {
      return (
        <div className={styles.message}>
          <p className={styles.hint}>
            {filterValue
              ? `No scenes match “${filterValue}”.`
              : "You haven't saved any scenes yet. Use Save in the header to keep a scene here."}
          </p>
          {includeArchived ? null : (
            <p className={styles.hint}>
              Archived scenes are hidden; check Include archived to see them.
            </p>
          )}
        </div>
      );
    }
    return (
      <InfiniteScroll
        dataLength={items.length}
        hasMore={query.hasNextPage && !query.isFetchNextPageError}
        next={query.fetchNextPage}
        loader={<LoadingSpinner label="Loading more scenes" />}
        scrollableTarget={SCROLL_ID}
        // The library's inner overflow: auto would nest a second scroller
        // and clip card hover shadows at the grid's edges.
        style={{ overflow: "visible" }}
      >
        <ul role="list" className={styles.grid}>
          {items.map((item) => (
            <SceneCard
              key={item.key}
              to={sceneHref(item.key, ListType.Me)}
              title={titleOf(item)}
              modifiedDate={item.modifiedDate}
              archived={item.archived}
              current={item.key === sceneKey}
              actions={
                <Menu.Root>
                  <Menu.Trigger
                    render={
                      <IconButton
                        size="sm"
                        label={`Actions for ${titleOf(item)}`}
                      >
                        <Icon icon={moreVertical} aria-hidden="true" />
                      </IconButton>
                    }
                  />
                  <Menu.Popup>
                    <Menu.Item
                      icon={
                        <Icon
                          icon={item.archived ? archiveRestore : archiveIcon}
                        />
                      }
                      onClick={() => toggleArchived(item)}
                    >
                      {item.archived ? "Unarchive" : "Archive"}
                    </Menu.Item>
                    <Menu.Item
                      icon={<Icon icon={trash2} />}
                      tone="danger"
                      onClick={() => chooseDelete(item)}
                    >
                      Delete
                    </Menu.Item>
                  </Menu.Popup>
                </Menu.Root>
              }
            />
          ))}
        </ul>
        {query.isFetchNextPageError ? (
          <div className={styles.more}>
            <Button size="sm" onClick={() => query.fetchNextPage()}>
              Retry loading more
            </Button>
          </div>
        ) : null}
      </InfiniteScroll>
    );
  };

  return (
    <>
      <div className={styles.filterRow}>
        <TextField
          ref={filterRef}
          className={styles.filterField}
          label="Filter scenes"
          value={filterText}
          onChange={handleFilterChange}
        />
        <Checkbox
          label="Include archived"
          checked={includeArchived}
          onCheckedChange={handleIncludeArchived}
        />
      </div>
      <Drawer.Body id={SCROLL_ID}>{renderBody()}</Drawer.Body>
      <div role="status" aria-live="polite" className={u.visuallyHidden}>
        <span key={status.id}>{status.text}</span>
      </div>
      <DeleteSceneDialog
        open={deleteOpen}
        title={deleteTarget ? titleOf(deleteTarget) : ""}
        deleting={destroy.isPending}
        failed={deleteFailed}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
        onClosed={() => setDeleteTarget(null)}
        finalFocus={deleteDialogFinalFocus}
      />
    </>
  );
};

const MyScenes: React.FC = () => {
  const isAuthenticated = useAuthStatus();
  const signIn = useSignInDialog();
  if (isAuthenticated === "loading") {
    return (
      <Drawer.Body>
        <LoadingSpinner label="Loading scenes" />
      </Drawer.Body>
    );
  }
  if (isAuthenticated !== "authenticated") {
    return (
      <Drawer.Body>
        <div className={styles.message}>
          <p className={styles.hint}>Sign in to see the scenes you save.</p>
          <Button tone="accent" onClick={() => signIn.open()}>
            Sign in
          </Button>
        </div>
      </Drawer.Body>
    );
  }
  return <MyScenesList />;
};

export default MyScenes;
