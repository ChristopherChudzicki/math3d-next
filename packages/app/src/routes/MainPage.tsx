import React, { useCallback, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Sidebar from "@/util/components/sidebar";

import { useToggle } from "@/util/hooks";
import classNames from "classnames";
import Button from "@mui/material/Button";
import TitleInput from "@/features/sceneControls/TitleInput";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import CloudOutlinedIcon from "@mui/icons-material/CloudOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import styles from "./MainPage.module.css";

const cssVars = {
  "--sidebar-width": "375px",
  "--header-height": "50px",
  "--sidebar-z": "10",
  "--sidebar-duration": "0.5s",
} as React.CSSProperties;

type HeaderProps = {
  className?: string;
  title: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={classNames(props.className)}>
    <div className={styles["header-container"]}>
      <span className={styles.brand}>Math3d</span>
      {props.title}
      <nav className={styles["nav-container"]}>
        <Button
          href="#examples"
          variant="text"
          color="secondary"
          startIcon={<LightbulbOutlined fontSize="inherit" />}
        >
          Examples
        </Button>
        <Button
          variant="text"
          color="secondary"
          startIcon={<CloudOutlinedIcon fontSize="inherit" />}
        >
          Share
        </Button>
        <Button
          variant="text"
          color="secondary"
          startIcon={<HelpOutlineOutlinedIcon fontSize="inherit" />}
        >
          Contact
        </Button>
      </nav>
    </div>
  </header>
);

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
  const [search, setSearch] = useSearchParams();
  const raw = search.get(name);
  const valid = raw === null || values.includes(raw as T);
  useEffect(() => {
    if (!valid) {
      console.error("Invalid value for search param", name, raw);
    }
  }, [valid, name, raw]);
  const value = valid ? (raw as T) ?? defaultValue : defaultValue;
  const set = useCallback(
    (v: T) => {
      setSearch((current) => {
        const s = new URLSearchParams(current);
        if (v === defaultValue) {
          s.delete(name);
        } else {
          s.set(name, v);
        }
        return s;
      });
    },
    [name, setSearch]
  );
  return [value, set] as const;
};

const CONTROLS_VALUES = ["closed", "open"] as const;

const useBooleanSearchParam = (param: string, defaultValue: boolean) => {
  const [search, setSearch] = useSearchParams();
  const stringified = search.get(param);
  let value = defaultValue;
  if (stringified === "true") {
    value = true;
  } else if (stringified === "false") {
    value = false;
  }

  const toggle = useCallback(() => {
    setSearch((current) => {
      const s = new URLSearchParams(current);
      if (value !== defaultValue) {
        s.delete(param);
      } else {
        s.append(param, String(!value));
      }
      return s;
    });
  }, [value, setSearch, defaultValue, param]);

  return [value, toggle] as const;
};

const MainPage: React.FC = () => {
  const { sceneId } = useParams();
  const [examplesOpen, toggleExamplesOpen] = useToggle(false);
  const [controlsVisibility, setControlsVisibility] = useSearchEnum({
    name: "controls",
    values: CONTROLS_VALUES,
    defaultValue: "open",
  });
  const controlsOpen = controlsVisibility === "open";
  const handleControlsClick = useCallback(
    (currentlyOpen: boolean) => {
      if (currentlyOpen) {
        setControlsVisibility("closed");
      } else {
        setControlsVisibility("open");
      }
    },
    [setControlsVisibility]
  );
  return (
    <div className={styles.container} style={cssVars}>
      <Header title={<TitleInput />} className={styles.header} />
      <div className={styles.body}>
        <Sidebar
          className={styles.sidebar}
          side="left"
          visible={controlsOpen}
          onVisibleChange={handleControlsClick}
        >
          <SceneControls sceneId={sceneId} />
        </Sidebar>
        <Sidebar
          className={styles.sidebar}
          side="right"
          visible={examplesOpen}
          onVisibleChange={toggleExamplesOpen}
        />
        <Scene
          className={
            controlsOpen
              ? styles["scene-adjust-controls-open"]
              : styles["scene-adjust-controls-closed"]
          }
        />
      </div>
    </div>
  );
};

export default MainPage;
