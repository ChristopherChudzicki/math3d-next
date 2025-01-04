import React, { useCallback, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Button from "@mui/material/Button";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Close from "@mui/icons-material/Close";
import { useNavigate } from "react-router";
import Tab from "@mui/material/Tab";
import TabPanel from "@mui/lab/TabPanel";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import invariant from "tiny-invariant";
import ReferenceTable from "./ReferenceTable";
import * as helpData from "./helpData_old";

const topRightStyle: React.CSSProperties = {
  position: "absolute",
  top: 0,
  right: 0,
};

type TabConfig = {
  id: string;
  label: string;
  element: React.ReactNode;
};

const TABS: TabConfig[] = [
  {
    id: "functions",
    label: "Functions",
    element: <ReferenceTable entries={helpData.FUNCTIONS} />,
  },
  {
    id: "constants",
    label: "Constants",
    element: <div />,
  },
  {
    id: "examples",
    label: "Examples",
    element: <div />,
  },
  {
    id: "forums",
    label: "Q&A, Forum, & More",
    element: <div />,
  },
];

const HelpPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(TABS[0].id);
  const tab = TABS.find((t) => t.id === activeTab);
  invariant(tab);
  const navigate = useNavigate();
  const handleClose = useCallback(() => {
    navigate("../");
  }, [navigate]);

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      PaperProps={{
        sx: {
          height: "80vh",
          overflowY: "hidden",
        },
      }}
      onClose={handleClose}
    >
      <div style={topRightStyle}>
        <IconButton onClick={handleClose} aria-label="Close">
          <Close />
        </IconButton>
      </div>
      <DialogTitle>Help: {tab.label}</DialogTitle>
      <TabContext value={activeTab}>
        <DialogContent>
          <TabList
            sx={{ borderBottom: 1, borderColor: "divider" }}
            onChange={(_e, val) => {
              setActiveTab(val);
            }}
          >
            {TABS.map((t) => (
              <Tab key={t.id} value={t.id} label={t.label} />
            ))}
          </TabList>
          {TABS.map((t) => (
            <TabPanel
              sx={{ paddingTop: "0px", paddingBottom: "0px", width: "100%" }}
              key={t.id}
              value={t.id}
            >
              {t.element}
            </TabPanel>
          ))}
        </DialogContent>
      </TabContext>
      <DialogActions>
        <Button variant="outlined" color="secondary" onClick={handleClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpPage;
