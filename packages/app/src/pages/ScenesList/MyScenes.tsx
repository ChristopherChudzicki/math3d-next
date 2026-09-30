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
import { Dialog } from "@/ui/Dialog";
import IconButton from "@/ui/IconButton";
import LoadingSpinner from "@/ui/LoadingSpinner/LoadingSpinner";
import { Menu } from "@/ui/Menu";
import TextField from "@/ui/TextField";
import { u } from "@/util/styles";
import { useAuthStatus } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import { useSignInDialog } from "@/features/overlays/useSignInDialog";
import DeleteSceneDialog from "./DeleteSceneDialog";
import SceneCard from "./SceneCard/SceneCard";
import styles from "./ScenesList.module.css";

const SCROLL_ID = "my-scenes-scroll";

const titleOf = (scene: MiniScene) => scene.title || "Untitled";

const countMessage = (count: number) => {
  if (count === 0) return "No scenes";
  return count === 1 ? "1 scene" : `${count} scenes`;
};

const MyScenesList: React.FC = () => {
  const { sceneKey } = useParams();
  const navigate = useNavigate();
  const { close } = useOverlay();
  const [filterText, setFilterText] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [status, setStatus] = useState("");
  const [pendingDelete, setPendingDelete] = useState<MiniScene | null>(null);
  const [deleting, setDeleting] = useState(false);
  const patch = usePatchScene();
  const destroy = useDestroyScene();

  const filterRef = useRef<HTMLInputElement>(null);
  const linkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // After Delete, the key whose card takes focus (null: the filter field).
  const deleteFocusKey = useRef<string | null | undefined>(undefined);
  const announceCount = useRef(false);

  const debouncedSetFilterValue = useMemo(
    () => debounce(setFilterValue, 300),
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
    if (announceCount.current && settled) {
      announceCount.current = false;
      setStatus(countMessage(query.data.pages[0]?.count ?? 0));
    }
  }, [settled, query.data]);
  useEffect(() => {
    if (query.isFetchingNextPage) setStatus("Loading more scenes…");
  }, [query.isFetchingNextPage]);

  const handleFilterChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    setFilterText(e.target.value);
    debouncedSetFilterValue(e.target.value);
    announceCount.current = true;
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
    (key && linkRefs.current.get(key)) || filterRef.current;

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
      setStatus(`${archiving ? "Archived" : "Unarchived"} ${titleOf(scene)}`);
      if (disappears) elementFor(focusKey)?.focus();
    } catch {
      setStatus(
        `Couldn't ${archiving ? "archive" : "unarchive"} ${titleOf(scene)}`,
      );
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const scene = pendingDelete;
    const focusKey = neighborKey(scene.key);
    setDeleting(true);
    try {
      await destroy.mutateAsync(scene.key);
      deleteFocusKey.current = focusKey;
      setPendingDelete(null);
      setStatus(`Deleted ${titleOf(scene)}`);
      if (scene.key === sceneKey) {
        // Replace, so Back doesn't return to the deleted scene.
        navigate("/?overlay=scenes&list=me", { replace: true });
      }
    } catch {
      setStatus(`Couldn't delete ${titleOf(scene)}`);
    } finally {
      setDeleting(false);
    }
  };
  const deleteDialogFinalFocus = () => {
    const focusKey = deleteFocusKey.current;
    deleteFocusKey.current = undefined;
    if (focusKey !== undefined) return elementFor(focusKey);
    // Cancelled: back to the menu button that started it.
    return (
      (pendingDelete && triggerRefs.current.get(pendingDelete.key)) ?? null
    );
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
            <p className={styles.hint}>Archived scenes are hidden.</p>
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
        // The library's own overflow: auto would clip card focus rings.
        style={{ overflow: "visible" }}
      >
        <ul role="list" className={styles.grid}>
          {items.map((item) => (
            <SceneCard
              key={item.key}
              to={`/${item.key}`}
              title={titleOf(item)}
              modifiedDate={item.modifiedDate}
              archived={item.archived}
              current={item.key === sceneKey}
              onCurrentClick={close}
              linkRef={(el) => {
                if (el) linkRefs.current.set(item.key, el);
                else linkRefs.current.delete(item.key);
              }}
              actions={
                <Menu.Root>
                  <Menu.Trigger
                    render={
                      <IconButton
                        ref={(el: HTMLButtonElement | null) => {
                          if (el) triggerRefs.current.set(item.key, el);
                          else triggerRefs.current.delete(item.key);
                        }}
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
                      onClick={() => setPendingDelete(item)}
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
      <Dialog.Body id={SCROLL_ID}>{renderBody()}</Dialog.Body>
      <div role="status" className={u.visuallyHidden}>
        {status}
      </div>
      <DeleteSceneDialog
        title={pendingDelete ? titleOf(pendingDelete) : null}
        deleting={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
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
      <Dialog.Body>
        <LoadingSpinner label="Loading scenes" />
      </Dialog.Body>
    );
  }
  if (isAuthenticated !== "authenticated") {
    return (
      <Dialog.Body>
        <div className={styles.message}>
          <p className={styles.hint}>Sign in to see the scenes you save.</p>
          <Button tone="accent" onClick={() => signIn.open()}>
            Sign in
          </Button>
        </div>
      </Dialog.Body>
    );
  }
  return <MyScenesList />;
};

export default MyScenes;
