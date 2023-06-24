import React, { useCallback, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Sidebar from "@/util/components/sidebar";

import classNames from "classnames";
import Button from "@mui/material/Button";
import TitleInput from "@/features/sceneControls/TitleInput";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";
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
        <ShareButton />
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
    [defaultValue, name, navigate, search, location.hash]
  );
  return [value, set] as const;
};

const CONTROLS_VALUES = ["0", "1"] as const;

const MainPage: React.FC = () => {
  const { sceneKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
    [setControlsVisibility]
  );
  const examplesOpen = location.hash === "#examples";
  const handleExamplesClick = useCallback(() => {
    if (!examplesOpen) {
      navigate({ hash: "examples", search: location.search });
    } else {
      navigate({ hash: undefined, search: location.search });
    }
  }, [navigate, examplesOpen, location.search]);
  return (
    <div className={styles.container} style={cssVars}>
      <Header title={<TitleInput />} className={styles.header} />
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
        <Sidebar
          className={styles.sidebar}
          side="right"
          visible={examplesOpen}
          onVisibleChange={handleExamplesClick}
          label="Examples"
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
