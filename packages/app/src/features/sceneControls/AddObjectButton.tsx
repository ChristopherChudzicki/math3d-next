import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import { addableTypes, mathItemConfigs } from "@/configs";
import React, { useRef } from "react";
import { useAppDispatch } from "@/store/hooks";
import idGenerator from "@/util/idGenerator";

import { useToggle } from "@/util/hooks";
import { mathItemsSlice } from "./mathItems";

const { actions } = mathItemsSlice;

type Props = {
  className?: string;
};

const AddObjectButton: React.FC<Props> = (props) => {
  const anchor = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useToggle(false);

  const dispatch = useAppDispatch();

  return (
    <div className={props.className}>
      <Button
        variant="outlined"
        id="basic-button"
        ref={anchor}
        aria-controls={open ? "basic-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        onClick={setOpen.on}
      >
        Add New Object
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchor.current}
        open={open}
        onClose={setOpen.off}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
      >
        {addableTypes.map((type) => {
          const { label } = mathItemConfigs[type];
          const handleClick = () => {
            dispatch(actions.addNewItem({ type, id: idGenerator.next() }));
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
