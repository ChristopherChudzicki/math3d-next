import React, { useCallback, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Dialog } from "@/ui/Dialog";
import { Tabs } from "@/ui/Tabs";
import { useAuthStatus, DISPLAY_AUTH_FLOWS } from "@/features/auth";
import { useOverlay } from "@/features/overlays/useOverlay";
import ExamplesListing from "./ExamplesListing";
import MyScenes from "./MyScenes";
import { OPEN_SCENES_BUTTON_ID } from "./constants";
import styles from "./ScenesList.module.css";

enum ListType {
  Examples = "examples",
  Me = "me",
}
const normalizeListType = (
  listType: string,
  showMyScenes: boolean,
): ListType => {
  if (!showMyScenes && listType === ListType.Me) {
    return ListType.Examples;
  }
  if (Object.values(ListType).includes(listType as ListType)) {
    return listType as ListType;
  }
  return ListType.Examples;
};

// The dialog unmounts on close, and whatever opened it (a menu item, a deep
// link) may be gone, so focus always returns to the header's scenes button.
const focusOpenScenesButton = () =>
  document.getElementById(OPEN_SCENES_BUTTON_ID);

const ScenesList: React.FC = () => {
  const [search] = useSearchParams();
  const { open, close } = useOverlay();
  const isAuthenticated = useAuthStatus();
  const showMyScenes =
    DISPLAY_AUTH_FLOWS || isAuthenticated === "authenticated";
  const rawList = search.get("list") ?? ListType.Examples;
  const listType = normalizeListType(rawList, showMyScenes);

  useEffect(() => {
    if (listType !== rawList) open("scenes", { list: listType });
  }, [open, rawList, listType]);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) close();
    },
    [close],
  );

  return (
    <Dialog.Root open onOpenChange={handleOpenChange}>
      <Dialog.Popup size="lg" finalFocus={focusOpenScenesButton}>
        <Tabs.Root
          className={styles.tabs}
          value={listType}
          onValueChange={(value) => open("scenes", { list: value })}
        >
          <Dialog.Header>
            <div className={styles.titleRow}>
              <Dialog.Title>Scenes</Dialog.Title>
              <Tabs.List aria-label="Scenes">
                {showMyScenes && (
                  <Tabs.Tab value={ListType.Me}>My Scenes</Tabs.Tab>
                )}
                <Tabs.Tab value={ListType.Examples}>Examples</Tabs.Tab>
              </Tabs.List>
            </div>
          </Dialog.Header>
          {/*
           * Base UI makes panels tab stops, which APG reserves for panels
           * whose content isn't focusable; these start with a field or a card.
           */}
          <Tabs.Panel
            value={ListType.Me}
            className={styles.panel}
            tabIndex={-1}
          >
            <MyScenes />
          </Tabs.Panel>
          <Tabs.Panel
            value={ListType.Examples}
            className={styles.panel}
            tabIndex={-1}
          >
            <ExamplesListing />
          </Tabs.Panel>
        </Tabs.Root>
      </Dialog.Popup>
    </Dialog.Root>
  );
};

export default ScenesList;
