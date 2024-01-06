import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import ShareButton from "@/features/sceneControls/mathItems/ShareButton";

import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Menu from "@mui/material/Menu";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useAuthStatus } from "@/features/auth";
import Button from "@mui/material/Button";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useToggle } from "@/util/hooks";
import styles from "./Header.module.css";

const LoginButtons: React.FC<{
  smallScreen: boolean;
  isAuthenticated: boolean;
}> = ({ smallScreen, isAuthenticated }) => {
  if (isAuthenticated) return null;
  if (smallScreen) {
    return (
      <>
        <MenuItem to="auth/login" component={Link}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign in</ListItemText>
        </MenuItem>
        <MenuItem to="auth/register" component={Link}>
          <ListItemIcon>
            <AccountCircleOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sign up</ListItemText>
        </MenuItem>
      </>
    );
  }
  return (
    <>
      <Button
        variant="text"
        color="secondary"
        component={Link}
        to="auth/register"
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign up
      </Button>
      <Button
        variant="text"
        color="secondary"
        component={Link}
        to="auth/login"
        startIcon={<AccountCircleOutlinedIcon fontSize="small" />}
      >
        Sign in
      </Button>
    </>
  );
};

const HeaderMenu: React.FC = () => {
  const smallScreen = useMediaQuery("(max-width: 600px)");
  const [menuOpen, toggleMenuOpen] = useToggle(false);
  const [buttonEl, setButtonEl] = useState<HTMLElement | null>(null);

  const [isAuthenticated] = useAuthStatus();
  const navigate = useNavigate();
  return (
    <nav className={styles["nav-container"]}>
      <ShareButton variant={smallScreen ? "mobile" : "desktop"} />
      {smallScreen ? null : (
        <LoginButtons isAuthenticated={isAuthenticated} smallScreen={false} />
      )}

      <IconButton
        aria-label="App Menu"
        onClick={toggleMenuOpen.on}
        ref={setButtonEl}
      >
        <MenuIcon />
      </IconButton>
      <Menu
        keepMounted
        open={menuOpen}
        anchorEl={buttonEl}
        onClose={toggleMenuOpen.off}
        onClick={toggleMenuOpen.off}
      >
        {smallScreen ? (
          <LoginButtons isAuthenticated={isAuthenticated} smallScreen />
        ) : null}
        <MenuItem onClick={() => navigate("scenes/examples")}>
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
        {isAuthenticated ? (
          <MenuItem to="auth/logout" component={Link}>
            <ListItemIcon>
              <AccountCircleOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        ) : null}
      </Menu>
    </nav>
  );
};

type HeaderProps = {
  title: React.ReactNode;
};

const Header: React.FC<HeaderProps> = (props) => (
  <header className={styles.header}>
    <div className={styles["header-container"]}>
      <span className={styles.brand}>Math3d</span>
      {props.title}
      <HeaderMenu />
    </div>
  </header>
);

export default Header;
