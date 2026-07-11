import React, { useCallback, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Sidebar from "@/util/components/sidebar";
import { useBodyClass, useToggle } from "@/util/hooks";
import TitleInput from "@/features/sceneControls/TitleInput";

import { ToggleKeyboardButton } from "@/features/virtualKeyboard";

import { useSelector } from "react-redux";

import { select } from "@/features/sceneControls/mathItems/sceneSlice";
import styles from "./MainPage.module.css";
import Header from "./components/Header";
import LegacyDialog from "./components/LegacyDialog";
import LegacyBanner from "./components/LegacyBanner";

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
  const isLegacy = useSelector(select.isLegacy);
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
    <div className={styles.container}>
      <Header title={<TitleInput />} />
      {sceneKey && isLegacy ? (
        // Keyed by sceneKey: this instance owns its own dismiss/remember
        // state, which must reset when navigating to a different scene
        // rather than carrying over (MainPage doesn't remount on its own).
        <LegacyBanner key={sceneKey} onViewDetails={legacyDialog.on} />
      ) : null}
      <div className={styles.body}>
        <Sidebar
          className={styles.sidebar}
          side="left"
          visible={controlsOpen}
          onVisibleChange={handleControlsClick}
          label="Controls"
        >
          <SceneControls sceneKey={sceneKey} />
        </Sidebar>
        <Scene
          className={
            controlsOpen
              ? styles["scene-adjust-controls-open"]
              : styles["scene-adjust-controls-closed"]
          }
        />
      </div>
      <ToggleKeyboardButton />
      {sceneKey && isLegacy ? (
        <LegacyDialog
          sceneKey={sceneKey}
          open={legacyDialogOpen}
          onOpen={legacyDialog.on}
          onClose={legacyDialog.off}
        />
      ) : null}
    </div>
  );
};

export default MainPage;
