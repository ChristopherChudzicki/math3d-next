import React, { useCallback, useEffect, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  Link,
} from "react-router-dom";
import Scene from "@/features/scene";
import SceneControls from "@/features/sceneControls";
import Sidebar from "@/util/components/sidebar";

import classNames from "classnames";
import TitleInput from "@/features/sceneControls/TitleInput";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";
import { useBodyClass, useToggle } from "@/util/hooks";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { ToggleKeyboardButton } from "@/features/virtualKeyboard";
import { useAuthStatus } from "@/features/auth";
import Button from "@mui/material/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import styles from "./MainPage.module.css";
import ExamplesDrawer from "./ExamplesDrawer";

type HeaderMenuProps = {
  onClickExamples: () => void;
};

const HeaderMenu: React.FC<HeaderMenuProps> = (props) => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const [menuOpen, toggleMenuOpen] = useToggle(false);
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null);

  const [isAuthenticated] = useAuthStatus();

  return (
    <nav className={styles["nav-container"]}>
      <ShareButton variant={smallScreen ? "mobile" : "desktop"} />
      {!isAuthenticated ? (
        <Button
          variant="text"
          color="secondary"
          component={Link}
          to="auth/login"
          startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
        >
          Login
        </Button>
      ) : null}
      <IconButton onClick={toggleMenuOpen.on} ref={setButtonEl}>
        <MenuIcon />
      </IconButton>
      <Menu
        keepMounted
        open={menuOpen}
        anchorEl={buttonEl}
        onClose={toggleMenuOpen.off}
        onClick={toggleMenuOpen.off}
      >
        {isAuthenticated ? (
          <MenuItem to="auth/logout" component={Link}>
            <ListItemIcon>
              <AccountCircleOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        ) : null}
        <MenuItem onClick={props.onClickExamples}>
          <ListItemIcon>
            <LightbulbOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Examples</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <HelpOutlineOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Contact</ListItemText>
        </MenuItem>
      </Menu>
    </nav>
  );
};

type HeaderProps = {
  className?: string;
  title: React.ReactNode;
  onClickExamples: () => void;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={classNames(props.className)}>
    <div className={styles["header-container"]}>
      <span className={styles.brand}>Math3d</span>
      {props.title}
      <HeaderMenu onClickExamples={props.onClickExamples} />
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
    [defaultValue, name, navigate, search, location.hash],
  );
  return [value, set] as const;
};

const CONTROLS_VALUES = ["0", "1"] as const;

const MainPage: React.FC = () => {
  useBodyClass(styles.bodyVariables);
  const { sceneKey } = useParams();
  const [examplesOpen, toggleExamplesOpen] = useToggle(false);
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
      <Header
        title={<TitleInput />}
        className={styles.header}
        onClickExamples={toggleExamplesOpen.on}
      />
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
        <ExamplesDrawer open={examplesOpen} onClose={toggleExamplesOpen.off} />
        <Scene
          className={
            controlsOpen
              ? styles["scene-adjust-controls-open"]
              : styles["scene-adjust-controls-closed"]
          }
        />
      </div>
      <ToggleKeyboardButton />
    </div>
  );
};

export default MainPage;
