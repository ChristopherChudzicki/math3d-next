import React, { useCallback, useEffect, useRef } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import Viewport from "@/features/viewport/Viewport";
import useSceneLoader from "@/app/useSceneLoader";
import SceneControls from "@/features/editor/sidebar/SceneControls";
import SliderAnimations from "@/features/editor/items/forms/VariableSlider/SliderAnimations";
import Sidebar from "@/ui/Sidebar";
import { useBodyClass, useToggle } from "@/util/hooks";
import SceneTitle, { SCENE_TITLE_ID } from "@/features/sceneActions/SceneTitle";

import ToggleKeyboardButton from "@/features/editor/virtualKeyboard/KeyboardControls";

import { useSelector } from "react-redux";

import * as select from "@/store/scene/state/selectors";
import { BannersProvider } from "@/ui/Banners/BannerContext";
import BannerDisplay from "@/ui/Banners/BannerDisplay";
import styles from "./MainPage.module.css";
import Header from "./components/Header";
import LegacyDialog from "./components/LegacyDialog";
import LegacyBanner from "./components/LegacyBanner";
import SceneUnavailable from "./components/SceneUnavailable";

type UseSearchEnumOptions<T extends string = string> = {
  name: string;
  values: readonly T[];
  defaultValue: T;
};

const useSearchEnum = <T extends string>({
  name,
  values,
  defaultValue,
}: UseSearchEnumOptions<T>) => {
  const [search] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const raw = search.get(name);
  const valid = raw === null || values.includes(raw as T);
  useEffect(() => {
    if (!valid) {
      // eslint-disable-next-line no-console
      console.error(`Invalid value ${raw} for search parameter ${name}`);
    }
  }, [valid, name, raw]);
  const value = valid ? (raw as T) ?? defaultValue : defaultValue;
  const set = useCallback(
    (v: T) => {
      const next = new URLSearchParams(search);
      if (v === defaultValue) {
        next.delete(name);
      } else {
        next.set(name, v);
      }
      navigate({ search: next.toString(), hash: location.hash });
    },
    [defaultValue, name, navigate, search, location.hash],
  );
  return [value, set] as const;
};

const CONTROLS_VALUES = ["0", "1"] as const;

const MainPage: React.FC = () => {
  useBodyClass(styles.bodyVariables);
  const { sceneKey } = useParams();
  const sceneLoad = useSceneLoader(sceneKey);
  const unavailable =
    sceneLoad.status !== "ready" && sceneLoad.status !== "loading"
      ? sceneLoad.status
      : null;

  // When the card goes away while it holds focus (a retry or reconnect
  // succeeded, or "New scene"), focus moves to the scene's title. The title
  // renders a commit later, once the store holds the route's scene.
  const focusTitle = useRef(false);
  const titleShown = sceneLoad.holdsRouteScene;
  useEffect(() => {
    if (unavailable) focusTitle.current = false;
  }, [unavailable]);
  useEffect(() => {
    if (!focusTitle.current || !titleShown) return;
    focusTitle.current = false;
    document.getElementById(SCENE_TITLE_ID)?.focus();
  }, [titleShown]);
  const handleCardLeftWithFocus = useCallback(() => {
    focusTitle.current = true;
  }, []);
  // The store holds the previous route's scene until this one is ready.
  const isLegacy = useSelector(select.isLegacy) && sceneLoad.status === "ready";
  const [legacyDialogOpen, legacyDialog] = useToggle(false);
  // legacyDialogOpen lives here (not in LegacyDialog) so the banner's "View
  // details" and the pill can share one dialog instance. MainPage itself
  // doesn't remount on sceneKey changes, so without this, navigating from one
  // legacy scene to another (leaving the dialog open) would carry the open
  // state over and pop the dialog open on the new scene.
  useEffect(() => {
    legacyDialog.off();
  }, [sceneKey, legacyDialog]);

  const [controlsVisibility, setControlsVisibility] = useSearchEnum({
    name: "controls",
    values: CONTROLS_VALUES,
    defaultValue: "1",
  });
  const controlsOpen = controlsVisibility === "1";
  const handleControlsClick = useCallback(
    (currentlyOpen: boolean) => {
      if (currentlyOpen) {
        setControlsVisibility("0");
      } else {
        setControlsVisibility("1");
      }
    },
    [setControlsVisibility],
  );
  return (
    // Banners are scoped to MainPage: BannerDisplay renders inside this grid
    // (publishing --banner-height for the sidebar's scroll calc), so a banner
    // shown from anywhere else in the app would have no display to render into.
    // Keeping the provider here makes that scope truthful.
    <BannersProvider>
      <div className={styles.container}>
        <Header title={<SceneTitle />} />
        <BannerDisplay />
        {sceneKey && isLegacy ? (
          <LegacyBanner sceneKey={sceneKey} onViewDetails={legacyDialog.on} />
        ) : null}
        <div className={styles.body}>
          {unavailable ? (
            // Not the editor: the store may hold the previous route's scene.
            <SceneUnavailable
              key={sceneKey}
              status={unavailable}
              failure={sceneLoad.failure}
              failedAttempts={sceneLoad.failedAttempts}
              retrying={sceneLoad.retrying}
              onRetry={sceneLoad.retry}
              onUnmountWithFocus={handleCardLeftWithFocus}
            />
          ) : (
            <>
              <SliderAnimations />
              <Sidebar
                className={styles.sidebar}
                side="left"
                visible={controlsOpen}
                onVisibleChange={handleControlsClick}
                label="Controls"
              >
                <SceneControls loading={sceneLoad.status === "loading"} />
              </Sidebar>
              <Viewport
                className={
                  controlsOpen
                    ? styles["scene-adjust-controls-open"]
                    : styles["scene-adjust-controls-closed"]
                }
              />
            </>
          )}
        </div>
        {unavailable ? null : <ToggleKeyboardButton />}
        {sceneKey && isLegacy ? (
          <LegacyDialog
            sceneKey={sceneKey}
            open={legacyDialogOpen}
            onOpen={legacyDialog.on}
            onClose={legacyDialog.off}
          />
        ) : null}
      </div>
    </BannersProvider>
  );
};

export default MainPage;
