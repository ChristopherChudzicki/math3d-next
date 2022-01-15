import React from "react";
import { useAppDispatch } from "app/hooks";
import { Button } from "react-bootstrap";
import { slice } from "./mathItems";

const { actions } = slice;

type Props = {
  className: string;
};

const AddObjectButton: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();
  return (
    <Button
      className={props.className}
      variant="outline-secondary"
      onClick={() => {
        dispatch(actions.addNewItem());
      }}
    >
      Add Object
    </Button>
  );
};

export default AddObjectButton;
