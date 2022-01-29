import React from "react";
import { useAppDispatch } from "app/hooks";
import { slice } from "./mathItems";

const { actions } = slice;

type Props = {
  className?: string;
};

const AddObjectButton: React.FC<Props> = (props) => {
  const dispatch = useAppDispatch();
  return (
    <button
      type="button"
      className={props.className}
      onClick={() => {
        dispatch(actions.addNewItem());
      }}
    >
      Add Object
    </button>
  );
};

export default AddObjectButton;
