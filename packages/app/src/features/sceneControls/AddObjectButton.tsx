import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { addableTypes, mathItemConfigs } from "@math3d/mathitem-configs";
import React, { useId, useRef } from "react";
import { useAppDispatch } from "@/store/hooks";

import { useToggle } from "@/util/hooks";
import { Typography } from "@mui/material";
import { mathItemsSlice } from "./mathItems";

const { actions } = mathItemsSlice;

type Props = {
  className?: string;
};

const style = {
  background: "linear-gradient(rgb(250, 250, 250), rgb(217, 217, 217))",
};

const AddObjectButton: React.FC<Props> = (props) => {
  const btnId = useId();
  const anchor = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useToggle(false);

  const dispatch = useAppDispatch();

  return (
    <div className={props.className}>
      <Button
        sx={style}
        color="secondary"
        variant="outlined"
        id={btnId}
        ref={anchor}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={setOpen.on}
      >
        <Typography fontWeight="inherit" color="secondary.dark">
          Add Object
        </Typography>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchor.current}
        open={open}
        onClose={setOpen.off}
        MenuListProps={{
          "aria-labelledby": btnId,
        }}
      >
        {addableTypes.map((type) => {
          const { label } = mathItemConfigs[type];
          const handleClick = () => {
            dispatch(actions.addNewItem({ type }));
            setOpen.off();
          };
          return (
            <MenuItem key={type} onClick={handleClick}>
              {label}
            </MenuItem>
          );
        })}
      </Menu>
    </div>
  );
};

export default AddObjectButton;
