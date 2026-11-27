import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Drawer } from "@/ui/Drawer";
import { Tabs } from "@/ui/Tabs";
import { useAuthStatus } from "@/services/auth/useAuthStatus";
import { DISPLAY_AUTH_FLOWS } from "@/config/displayAuthFlows";
import { useOverlay } from "@/services/overlays/useOverlay";
import type { OverlayProps } from "@/services/overlays/useOverlay";
import { useUrlLayerLocation } from "@/services/overlays/UrlLayer";
import { ListType } from "@/services/overlays/search";
import ExamplesListing from "@/features/library/ExamplesListing";
import MyScenes from "@/features/library/MyScenes";
import UnsavedScenes from "@/features/library/UnsavedScenes";
import useDrafts from "@/features/library/useDrafts";
import {
  OPEN_SCENES_BUTTON_ID,
  SCENES_DRAWER_SIZE,
} from "@/features/library/constants";
import styles from "./ScenesListPage.module.css";

const normalizeListType = (
  listType: ListType,
  showMyScenes: boolean,
): ListType =>
  !showMyScenes && listType === ListType.Me ? ListType.Examples : listType;

// Whatever opened the drawer (a menu item, a deep link) may be gone by the
// time it closes, so focus always returns to the header's scenes button.
const focusOpenScenesButton = () =>
  document.getElementById(OPEN_SCENES_BUTTON_ID);

const ScenesListContent: React.FC<{ children?: React.ReactNode }> = ({
  children,
}) => {
  const { search } = useUrlLayerLocation();
  const { open } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const showMyScenes =
    DISPLAY_AUTH_FLOWS || isAuthenticated === "authenticated";
  const rawList = search.list ?? ListType.Examples;
  const listType = normalizeListType(rawList, showMyScenes);
  const unsavedCount = useDrafts()?.length ?? 0;

  useEffect(() => {
    if (listType !== rawList) open("scenes", { list: listType });
  }, [open, rawList, listType]);

  // A switch made outside the tab list (My Scenes' "Unsaved" link) would
  // lose focus with the panel it came from, so focus goes to the new tab.
  const tabList = useRef<HTMLDivElement>(null);
  const shownList = useRef(listType);
  useLayoutEffect(() => {
    if (shownList.current === listType) return;
    shownList.current = listType;
    if (tabList.current?.contains(document.activeElement)) return;
    tabList.current
      ?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')
      ?.focus();
  }, [listType]);

  return (
    <>
      <Tabs.Root
        className={styles.tabs}
        value={listType}
        onValueChange={(value) => open("scenes", { list: value })}
      >
        <Drawer.Header>
          <div className={styles.titleRow}>
            <Drawer.Title>Scenes</Drawer.Title>
            <Tabs.List aria-label="Scenes" ref={tabList}>
              {showMyScenes && (
                <Tabs.Tab value={ListType.Me}>My Scenes</Tabs.Tab>
              )}
              <Tabs.Tab value={ListType.Examples}>Examples</Tabs.Tab>
              <Tabs.Tab value={ListType.Unsaved}>
                {unsavedCount > 0 ? `Unsaved (${unsavedCount})` : "Unsaved"}
              </Tabs.Tab>
            </Tabs.List>
          </div>
        </Drawer.Header>
        {/*
         * Base UI makes panels tab stops, which APG reserves for panels
         * whose content isn't focusable; these start with a field or a card.
         * `UnsavedScenes` renders its own panel, for its empty state.
         */}
        <Tabs.Panel value={ListType.Me} className={styles.panel} tabIndex={-1}>
          <MyScenes />
        </Tabs.Panel>
        <Tabs.Panel
          value={ListType.Examples}
          className={styles.panel}
          tabIndex={-1}
        >
          <ExamplesListing />
        </Tabs.Panel>
        <UnsavedScenes className={styles.panel} />
      </Tabs.Root>
      {children}
    </>
  );
};

const ScenesList: React.FC<OverlayProps> = ({ open, children }) => {
  const { close } = useOverlay();
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) close();
    },
    [close],
  );

  return (
    <Drawer.Root open={open} onOpenChange={handleOpenChange}>
      <Drawer.Popup
        side="right"
        size={SCENES_DRAWER_SIZE}
        finalFocus={focusOpenScenesButton}
      >
        <ScenesListContent>{children}</ScenesListContent>
      </Drawer.Popup>
    </Drawer.Root>
  );
};

export default ScenesList;
